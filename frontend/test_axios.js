const axios = require("axios");

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

console.log(api.getUri({ url: '/fees/approvals' }));
console.log(api.getUri({ url: 'fees/approvals' }));
