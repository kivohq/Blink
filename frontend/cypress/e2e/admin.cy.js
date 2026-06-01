describe('Admin Management', () => {
  beforeEach(() => {
    // Assuming login is handled by a custom command or direct visit
    cy.visit('/login');
    // Add login logic here
  });

  it('should allow owner to promote a member to admin', () => {
    // Select group, click member, verify promote button exists, click it, verify change
    cy.get('[data-context="group-item"]').first().click();
    cy.contains('Members').click();
    cy.contains('Promote').first().click();
    cy.contains('Admin').should('be.visible');
  });

  it('should allow owner to delete the group', () => {
    cy.get('[data-context="group-item"]').first().click();
    cy.contains('Delete Group').click();
    // Handle confirmation
    cy.on('window:confirm', () => true);
    cy.contains('Group deleted successfully').should('be.visible');
  });
});
