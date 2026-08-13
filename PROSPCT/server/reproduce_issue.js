const axios = require('axios');

async function testInvalidUrl() {
  try {
    await axios.post('', {});
  } catch (error) {
  }

  try {
    await axios.post('invalid', {});
  } catch (error) {
  }
}

testInvalidUrl();
