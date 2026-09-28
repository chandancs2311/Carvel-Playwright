/**
 * Product Details Page (PDP) & Modifier Locators (Scooped Ice Cream)
 * Based on verified DOM from Carvel UAT.
 */
const productLocators = {
  // Cup Size radio options (by testid or role radio / label / text)
  size: {
    kidsCup: (page) =>
      page.getByTestId('product_list_itf-9593').or(page.getByRole('radio', { name: /kids/i })).or(page.getByText('Kids Cup', { exact: false })),
    smallCup: (page) =>
      page.getByTestId('product_list_itf-2165').or(page.getByRole('radio', { name: /small/i })).or(page.getByText('Small Cup', { exact: false })),
    mediumCup: (page) =>
      page.getByTestId('product_list_itf-6258').or(page.getByRole('radio', { name: /medium/i })).or(page.getByText('Medium Cup', { exact: false })),
    largeCup: (page) =>
      page.getByTestId('product_list_itf-6303').or(page.getByRole('radio', { name: /large/i })).or(page.getByText('Large Cup', { exact: false })),
  },

  // Flavor Choice accordion & options
  flavors: {
    accordion: (page) => page.getByTestId('test_accordion_itg-1596'),
    strawberry: (page) => page.getByTestId('product_list_itf-48000'),
    oreoCookiesCream: (page) => page.getByTestId('product_list_itf-3675'),
    mintOreo: (page) => page.getByTestId('product_list_itf-99999'),
    coldBrew: (page) => page.getByTestId('product_list_itf-3811'),
    orangeDreamyCreamy: (page) => page.getByTestId('product_list_itf-5002'),
    pistachio: (page) => page.getByTestId('product_list_itf-15999'),
    peanutButter: (page) => page.getByTestId('product_list_itf-21374'),
    chocolatePeanutButter: (page) => page.getByTestId('product_list_itf-5280'),
  },

  // Extra Toppings accordion & options
  toppings: {
    accordion: (page) => page.getByTestId('test_accordion_itg-3633'),
    vanillaCrunchies: (page) => page.getByTestId('product_list_itf-2703'),
    chocolateCarvelCrunchies: (page) => page.getByTestId('product_list_itf-9972'),
    strawberryCrunchies: (page) => page.getByTestId('product_list_itf-3022'),
    whippedCream: (page) => page.getByTestId('product_list_itf-1058'),
    bananas: (page) => page.getByTestId('product_list_itf-3257'),
    blackCherries: (page) => page.getByTestId('product_list_itf-9471'),
    brownieBites: (page) => page.getByTestId('product_list_itf-9669'),
    cakeConeOnTheSide: (page) => page.getByTestId('product_list_itf-5593'),
    caramelTopping: (page) => page.getByTestId('product_list_itf-4100'),
    chocolateChips: (page) => page.getByTestId('product_list_itf-5326'),
    chocolateSprinkles: (page) => page.getByTestId('product_list_itf-4941'),
    chocolateSyrup: (page) => page.getByTestId('product_list_itf-3203'),
    confettiSprinkles: (page) => page.getByTestId('product_list_itf-2236'),
    cookieDough: (page) => page.getByTestId('product_list_itf-9354'),
    fudge: (page) => page.getByTestId('product_list_itf-6726'),
    heathBar: (page) => page.getByTestId('product_list_itf-4252'),
    mAndMs: (page) => page.getByTestId('product_list_itf-6268'),
    marshmallowSauce: (page) => page.getByTestId('product_list_itf-7741'),
    crushedOreo: (page) => page.getByTestId('product_list_itf-4789'),
    crushedPeanut: (page) => page.getByTestId('product_list_itf-6302'),
    pineapple: (page) => page.getByTestId('product_list_itf-6400'),
    poundCake: (page) => page.getByTestId('product_list_itf-7838'),
    rainbowSprinkles: (page) => page.getByTestId('product_list_itf-7586'),
    reesesPBCups: (page) => page.getByTestId('product_list_itf-5423'),
    reesesPBSauce: (page) => page.getByTestId('product_list_itf-3790'),
    reesesPieces: (page) => page.getByTestId('product_list_itf-1763'),
    strawberries: (page) => page.getByTestId('product_list_itf-1293'),
    wetWalnuts: (page) => page.getByTestId('product_list_itf-7983'),
    gummyBears: (page) => page.getByTestId('product_list_itf-3251'),
    brownBonnet: (page) => page.getByTestId('product_list_itf-2217'),
  },

  // Add to Cart button
  addToCartButton: (page) => page.getByTestId('btn_add_to_cart'),

  // Price span inside Add to Cart button
  addToCartPrice: (page) =>
    page.getByTestId('btn_add_to_cart').locator('.btnPrice'),
};

module.exports = productLocators;
