const attendance = [{"date": "2026-04-10", "status": "PRESENT"}];
const rate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100) 
    : 0;
console.log(rate);
