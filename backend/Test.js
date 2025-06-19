const bcrypt = require('bcryptjs');
const result = bcrypt.compareSync('CoCo@2021', '$2a$12$Co3eItQwLLJLjC7wxP8rge2ConGE3Pbs5RFNr5JMxADaZ0.oP.yIO');
console.log("Password match:", result);