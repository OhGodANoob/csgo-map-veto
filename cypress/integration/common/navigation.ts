Given('Bob is on the home page', () => {
  cy.visit('/')
})

Given('Bob goes to the settings', () => {
  cy.visit('/')
    .getByTestId('button-settings')
    .click()
})