// Initialize Lucide icons
    lucide.createIcons();

function selectRole(card) {
    // Remove selected class from all cards
    document.querySelectorAll('.role-card').forEach(c => {
        c.classList.remove('selected');
    });       
    // adds the selected class to clicked card
    card.classList.add('selected');         
    // updates the colours of the icons when selected
    lucide.createIcons();
}