// ===========================
// VIEW TRANSACTIONS PAGE
// ===========================

// Wait until page loads
document.addEventListener("DOMContentLoaded", () => {

    initialiseDate();
    enableSearch();
    enableSorting();
    calculateTotals();
    animateRows();
    attachLogout();

});

// ===========================
// DATE IN HEADER
// ===========================

function initialiseDate() {
    const today = new Date();

    const formatted =
        today.toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    console.log("Loaded:", formatted);
}

// ===========================
// LOGOUT
// ===========================

function attachLogout() {

    const btn =
        document.querySelector(".topbar-logout");

    if (!btn) return;

    btn.addEventListener("click", () => {

        const confirmLogout =
            confirm("Logout?");

        if (confirmLogout) {

            localStorage.clear();

            window.location.href =
                "login.html";
        }

    });

}

// ===========================
// SEARCH TRANSACTIONS
// ===========================

function enableSearch() {

    const container =
        document.querySelector(".page-sub");

    const search =
        document.createElement("input");

    search.type = "text";

    search.placeholder =
        "Search transaction...";

    search.className =
        "transaction-search";

    container.insertAdjacentElement(
        "afterend",
        search
    );

    search.addEventListener(
        "input",
        filterTable
    );

}

function filterTable(e) {

    const value =
        e.target.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "tbody tr"
        );

    rows.forEach(row => {

        const text =
            row.textContent
                .toLowerCase();

        row.style.display =
            text.includes(value)
            ? ""
            : "none";

    });

}

// ===========================
// SORT TABLE
// ===========================

function enableSorting() {

    const headers =
        document.querySelectorAll(
            "th"
        );

    headers.forEach((header,index)=>{

        header.style.cursor =
            "pointer";

        header.addEventListener(
            "click",
            ()=>sortTable(index)
        );

    });

}

function sortTable(index) {

    const tbody =
        document.querySelector(
            "tbody"
        );

    const rows =
        Array.from(
            tbody.querySelectorAll(
                "tr"
            )
        );

    rows.sort((a,b)=>{

        const aText =
            a.children[index]
            .innerText;

        const bText =
            b.children[index]
            .innerText;

        return aText.localeCompare(
            bText
        );

    });

    rows.forEach(row=>{

        tbody.appendChild(
            row
        );

    });

}

// ===========================
// TOTALS
// ===========================

function calculateTotals() {

    const rows =
        document.querySelectorAll(
            "tbody tr"
        );

    let total = 0;

    rows.forEach(row=>{

        const amount =
            row.children[3]
            .innerText
            .replace("R","")
            .replace(",","");

        total +=
            Number(amount);

    });

    const totalBox =
        document.createElement(
            "div"
        );

    totalBox.className =
        "transaction-total";

    totalBox.innerHTML =
        `
        Total Revenue:
        <strong>
        R ${total.toLocaleString()}
        </strong>
        `;

    document
        .querySelector(".section-card")
        .prepend(totalBox);

}

// ===========================
// ROW ANIMATION
// ===========================

function animateRows() {

    const rows =
        document.querySelectorAll(
            "tbody tr"
        );

    rows.forEach((row,index)=>{

        row.style.opacity = 0;

        setTimeout(()=>{

            row.style.transition =
                "0.4s";

            row.style.opacity = 1;

        }, index*150);

    });

}

// ===========================
// STATUS COUNTS
// ===========================

function countStatuses() {

    const statuses =
        document.querySelectorAll(
            "tbody td:last-child"
        );

    let complete = 0;
    let pending = 0;
    let rejected = 0;

    statuses.forEach(item=>{

        const text =
            item.innerText
            .toLowerCase();

        if (
            text.includes(
                "completed"
            )
        )
        complete++;

        if (
            text.includes(
                "pending"
            )
        )
        pending++;

        if (
            text.includes(
                "rejected"
            )
        )
        rejected++;

    });

    console.log({
        complete,
        pending,
        rejected
    });

}

countStatuses();;

