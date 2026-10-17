const books = [
  {
    id: 1,
    title: "Clean Code",
    category: "Software Engineering",
    price: 150,
    isBorrowed: true,
    borrowHistory: [
      {
        borrowDate: "2026-01-10",
        userId: 101
      },
      {
        borrowDate: "2026-03-01",
        userId: 102
      }
    ]
  },
  {
    id: 2,
    title: "JavaScript: The Good Parts",
    category: "Web Development",
    price: 120,
    isBorrowed: false,
    borrowHistory: [
      {
        borrowDate: "2025-11-15",
        userId: 103
      }
    ]
  },
  {
    id: 3,
    title: "Design Patterns",
    category: "Software Engineering",
    price: 180,
    isBorrowed: false,
    borrowHistory: []
  }
];

module.exports = {
  books
};