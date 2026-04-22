const axios = require('axios');

async function test() {
  const token = process.env.TOKEN;
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/parent/children/22222960-a83f-492e-99f3-a470c958111d/attendance/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Attendance length:", res.data.data.length);

    const invoices = await axios.get('http://127.0.0.1:8000/api/parent/children/22222960-a83f-492e-99f3-a470c958111d/fees/invoices/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Invoices length:", invoices.data.data.length);
  } catch (err) {
    console.error(err.response?.status, err.response?.data);
  }
}
test();
