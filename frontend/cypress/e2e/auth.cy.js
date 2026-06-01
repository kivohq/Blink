describe('Authentication Flow', () => {
  it('should navigate to the login page', () => {
    cy.visit('/login');
    cy.contains('Sign In').should('be.visible');
  });
});
