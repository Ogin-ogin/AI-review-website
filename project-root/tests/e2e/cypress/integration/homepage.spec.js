describe('Homepage', () => {
    beforeEach(() => {
      cy.visit('/');
    });
  
    it('should display the hero section with title and description', () => {
      cy.get('.hero-section').should('be.visible');
      cy.get('.hero-section h1').should('contain.text', 'AIレビュー動画分析サイト');
      cy.get('.hero-section p').should('contain.text', 'AIを活用して製品レビュー動画を分析し、最適な製品選びをサポートします。');
    });
  
    it('should navigate to categories section when "カテゴリを見る" button is clicked', () => {
      cy.get('.hero-button').click();
      cy.url().should('include', '#categories');
    });
  
    it('should display featured products', () => {
      cy.get('.featured-products').should('be.visible');
      cy.get('.featured-products .product-card').should('have.length.greaterThan', 0);
    });
  
    it('should navigate to product details page when a product card is clicked', () => {
      cy.get('.product-card').first().click();
      cy.url().should('include', '/product/');
    });
  });