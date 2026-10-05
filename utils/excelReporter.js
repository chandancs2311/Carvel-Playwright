/**
 * @fileoverview Custom Playwright Test Reporter generating enterprise-grade Excel reports (.xlsx).
 * Produces a dual-sheet workbook comprising an Executive KPI Dashboard and a detailed Test Execution
 * log capturing multi-line step breakdowns, granular assertions, timing, and sanitized error messages.
 *
 * @module utils/excelReporter
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * @typedef {Object} NormalizedTestRecord
 * @property {string} testId - Extracted or generated Test Case identifier (e.g., 'TC_001').
 * @property {string} suite - Hierarchical suite/feature name derived from parent describe blocks.
 * @property {string} title - Sanitized test title without ID prefix.
 * @property {string} rawTitle - Original full test title as defined in the test file.
 * @property {'passed'|'failed'|'timedOut'|'skipped'} status - Final execution verdict of the test.
 * @property {number} duration - Total runtime of the test case in milliseconds.
 * @property {Array<Error|Object>} errors - Collection of errors encountered during execution.
 * @property {Array<import('@playwright/test/reporter').TestStep>} steps - Hierarchical test steps and assertions.
 */

/**
 * Custom Playwright Reporter implementation generating structured Excel reports.
 *
 * @implements {import('@playwright/test/reporter').Reporter}
 */
class ExcelReporter {
  /**
   * Initializes the reporter instance with configurable destination paths.
   *
   * @param {Object} [options={}] - Reporter configuration options.
   * @param {string} [options.outputFile] - File path where the workbook will be written.
   * Defaults to environment variable EXCEL_REPORT_FILE or 'test-results/SmokeTestReport.xlsx'.
   */
  constructor(options = {}) {
    this.outputFile =
      process.env.EXCEL_REPORT_FILE ||
      options.outputFile ||
      'test-results/SmokeTestReport.xlsx';

    /** @type {NormalizedTestRecord[]} In-memory buffer storing completed test run records */
    this.testResults = [];

    /** @type {number} Epoch timestamp recording the start of report tracking */
    this.startTime = Date.now();
  }

  /**
   * Invoked upon completion of an individual test case run. Normalizes and buffers results.
   *
   * @param {import('@playwright/test/reporter').TestCase} test - Test case descriptor.
   * @param {import('@playwright/test/reporter').TestResult} result - Execution outcome and metadata.
   * @returns {void}
   */
  onTestEnd(test, result) {
    const tcMatch = test.title.match(/\b(TC[-_]?\d+[a-zA-Z]?)\b/i);
    const testId = tcMatch ? tcMatch[1].toUpperCase() : `TC_${this.testResults.length + 1}`;

    let cleanTitle = test.title;
    if (tcMatch) {
      cleanTitle = test.title.replace(new RegExp(`^${tcMatch[1]}\\s*:\\s*`, 'i'), '').trim();
    }

    let suiteName = 'Test Suite';
    if (test.parent) {
      const titles = [];
      let currentParent = test.parent;
      while (currentParent && currentParent.title) {
        titles.unshift(currentParent.title);
        currentParent = currentParent.parent;
      }
      suiteName = titles.join(' > ') || 'Test Suite';
    }

    this.testResults.push({
      testId,
      suite: suiteName,
      title: cleanTitle,
      rawTitle: test.title,
      status: result.status,
      duration: result.duration,
      errors: result.errors || [],
      steps: result.steps || [],
    });
  }

  /**
   * Invoked after all test suites have finished executing. Generates and serializes the workbook.
   *
   * @param {import('@playwright/test/reporter').FullResult} result - Summary of the overall test execution.
   * @returns {Promise<void>}
   */
  async onEnd(result) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Playwright Automation Framework';
    workbook.created = new Date();

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((t) => t.status === 'passed').length;
    const failedTests = this.testResults.filter(
      (t) => t.status === 'failed' || t.status === 'timedOut'
    ).length;
    const skippedTests = this.testResults.filter((t) => t.status === 'skipped').length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
    const totalDurationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);

    this._generateSummarySheet(workbook, {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate,
      totalDurationSec,
    });

    this._generateDetailsSheet(workbook);

    const targetDir = path.dirname(path.resolve(this.outputFile));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(this.outputFile);
    console.log(`\n📊 Excel Report successfully generated at: ${this.outputFile}`);
  }

  /**
   * Constructs the Executive Summary Dashboard worksheet.
   *
   * @private
   * @param {import('exceljs').Workbook} workbook - Target workbook instance.
   * @param {Object} metrics - Calculated execution statistics.
   * @returns {void}
   */
  _generateSummarySheet(workbook, metrics) {
    const sheet = workbook.addWorksheet('Summary Dashboard', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { width: 5 },
      { width: 28 },
      { width: 20 },
      { width: 20 },
      { width: 5 },
    ];

    sheet.mergeCells('B2:D2');
    const titleCell = sheet.getCell('B2');
    titleCell.value = 'AUTOMATION EXECUTION SUMMARY';
    titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 32;

    const metricRows = [
      ['Execution Date & Time', new Date().toLocaleString()],
      ['Total Test Cases Executed', metrics.totalTests],
      ['Total Passed', metrics.passedTests],
      ['Total Failed', metrics.failedTests],
      ['Total Skipped', metrics.skippedTests],
      ['Pass Rate (%)', `${metrics.passRate}%`],
      ['Total Execution Time', `${metrics.totalDurationSec}s`],
    ];

    metricRows.forEach((item, index) => {
      const rowIndex = index + 4;
      const row = sheet.getRow(rowIndex);
      row.height = 24;

      const labelCell = sheet.getCell(`B${rowIndex}`);
      labelCell.value = item[0];
      labelCell.font = { bold: true, size: 10 };
      labelCell.border = this._thinBorder();

      sheet.mergeCells(`C${rowIndex}:D${rowIndex}`);
      const valCell = sheet.getCell(`C${rowIndex}`);
      valCell.value = item[1];
      valCell.alignment = { horizontal: 'center', vertical: 'middle' };
      valCell.border = this._thinBorder();

      if (item[0] === 'Total Passed') {
        valCell.font = { bold: true, color: { argb: 'FF1B5E20' } };
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      } else if (item[0] === 'Total Failed' && metrics.failedTests > 0) {
        valCell.font = { bold: true, color: { argb: 'FFB71C1C' } };
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      } else if (item[0] === 'Pass Rate (%)') {
        const isSatisfactory = parseFloat(metrics.passRate) >= 80;
        valCell.font = {
          bold: true,
          size: 11,
          color: { argb: isSatisfactory ? 'FF1B5E20' : 'FFB71C1C' },
        };
      }
    });
  }

  /**
   * Constructs the Detailed Test Execution worksheet with one row per test case.
   *
   * @private
   * @param {import('exceljs').Workbook} workbook - Target workbook instance.
   * @returns {void}
   */
  _generateDetailsSheet(workbook) {
    const sheet = workbook.addWorksheet('Test Execution Details', {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Test ID', key: 'testId', width: 14 },
      { header: 'Test Suite', key: 'suite', width: 30 },
      { header: 'Test Case Title', key: 'title', width: 44 },
      { header: 'Overall Status', key: 'status', width: 18 },
      { header: 'Duration (s)', key: 'duration', width: 15 },
      { header: 'Steps & Assertions Breakdown', key: 'steps', width: 75 },
      { header: 'Error / Failure Reason', key: 'error', width: 55 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F497D' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = this._thinBorder();
    });

    for (const testItem of this.testResults) {
      const isPassed = testItem.status === 'passed';
      const formattedStatus = this._formatStatus(testItem.status);
      const durationSec = (testItem.duration / 1000).toFixed(2);
      const stepBreakdown = this._buildStepBreakdown(testItem);
      const cleanError = this._cleanErrorMessage(testItem.errors);

      const row = sheet.addRow({
        testId: testItem.testId,
        suite: testItem.suite,
        title: testItem.title,
        status: formattedStatus,
        duration: `${durationSec}s`,
        steps: stepBreakdown.text,
        error: cleanError,
      });

      const lineCount = Math.max(stepBreakdown.lineCount, cleanError.split('\n').length, 1);
      row.height = Math.max(28, lineCount * 17 + 8);

      this._styleDetailRow(row, isPassed, testItem.status);
    }
  }

  /**
   * Traverses test steps and granular assertion records, generating a unified multi-line summary.
   *
   * @private
   * @param {NormalizedTestRecord} testItem - Record containing step telemetry.
   * @returns {{ text: string, lineCount: number }} Formatted multiline step string and total line count.
   */
  _buildStepBreakdown(testItem) {
    const relevantSteps = testItem.steps.filter(
      (s) => s.category === 'test.step' || s.category === 'expect'
    );

    if (relevantSteps.length === 0) {
      const isPassed = testItem.status === 'passed';
      return {
        text: `1. Overall Test Run [${isPassed ? 'PASSED' : 'FAILED'} - ${(testItem.duration / 1000).toFixed(2)}s]`,
        lineCount: 1,
      };
    }

    const lines = [];

    relevantSteps.forEach((step) => {
      const isStepPassed = !step.error;
      const stepStatus = isStepPassed ? 'PASSED' : 'FAILED';
      const stepDur = (step.duration / 1000).toFixed(2);

      if (step.category === 'test.step') {
        lines.push(`${step.title}  [${stepStatus} - ${stepDur}s]`);

        if (step.steps && step.steps.length > 0) {
          const childEntries = step.steps.filter(
            (cs) => cs.category === 'expect' || cs.category === 'test.step'
          );
          childEntries.forEach((cs) => {
            const csPassed = !cs.error;
            const csStatus = csPassed ? 'PASSED' : 'FAILED';
            const csDur = (cs.duration / 1000).toFixed(2);
            const prefix = cs.category === 'expect' ? '↳ Assert' : '↳';
            lines.push(`     ${prefix}: ${cs.title}  [${csStatus} - ${csDur}s]`);
          });
        }
      } else if (step.category === 'expect') {
        lines.push(`Assert: ${step.title}  [${stepStatus} - ${stepDur}s]`);
      }
    });

    return {
      text: lines.join('\n'),
      lineCount: lines.length,
    };
  }

  /**
   * Sanitizes raw Playwright failure objects into concise, human-readable error messages.
   * Strips ANSI escape sequences and excludes verbose internal runtime stack frames.
   *
   * @private
   * @param {Array<Error|Object>} errors - Array of error objects from test results.
   * @returns {string} Cleaned error summary string.
   */
  _cleanErrorMessage(errors) {
    if (!errors || errors.length === 0) return '—';
    return errors
      .map((err) => {
        let message = err.message || String(err);
        message = message.replace(/\u001b\[[0-9;]*m/g, '');

        const filteredLines = message
          .split('\n')
          .filter((line) => !line.trim().startsWith('at ') && !line.includes('node_modules'))
          .slice(0, 7);

        return filteredLines.join('\n').trim();
      })
      .join('\n---\n');
  }

  /**
   * Normalizes raw Playwright status strings to standardized uppercase display values.
   *
   * @private
   * @param {string} status - Raw Playwright status ('passed'|'failed'|'timedOut'|'skipped').
   * @returns {string} Standardized status label.
   */
  _formatStatus(status) {
    switch (status) {
      case 'passed':
        return 'PASSED';
      case 'failed':
        return 'FAILED';
      case 'timedOut':
        return 'TIMED OUT';
      case 'skipped':
        return 'SKIPPED';
      default:
        return (status || 'UNKNOWN').toUpperCase();
    }
  }

  /**
   * Applies borders, alignment, fonts, and semantic color badges to test row cells.
   *
   * @private
   * @param {import('exceljs').Row} row - Current table row being styled.
   * @param {boolean} isPassed - Indicates if the test executed successfully.
   * @param {string} rawStatus - Raw Playwright status string for badge styling.
   * @returns {void}
   */
  _styleDetailRow(row, isPassed, rawStatus) {
    row.eachCell((cell, colNumber) => {
      cell.border = this._thinBorder();

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { bold: true };
      } else if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { bold: true };

        if (rawStatus === 'passed') {
          cell.font = { bold: true, color: { argb: 'FF1B5E20' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        } else if (rawStatus === 'skipped') {
          cell.font = { bold: true, color: { argb: 'FFE65100' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
        } else {
          cell.font = { bold: true, color: { argb: 'FFB71C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
        }
      } else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 6) {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        cell.font = { size: 10 };
      } else if (colNumber === 7) {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        cell.font = { size: 9, color: { argb: isPassed ? 'FF757575' : 'FFC62828' } };
      }
    });
  }

  /**
   * Produces a consistent, subtle light-gray border configuration for worksheet cells.
   *
   * @private
   * @returns {import('exceljs').Borders} ExcelJS border specification object.
   */
  _thinBorder() {
    return {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    };
  }
}

module.exports = ExcelReporter;
