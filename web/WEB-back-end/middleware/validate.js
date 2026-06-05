function required(body, fields) {
for (const f of fields) {
if (body[f] === undefined || body[f] === null || body[f] === '') {
const err = new Error(`Missing field: ${f}`);
err.status = 400; throw err;
}
}
}

module.exports = { required };