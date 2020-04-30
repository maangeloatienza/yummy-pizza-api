const generate = (length) => {
    let alphaNum = '';
    let stringPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    length = 8;
  
    for (let i = 0; i < length; i++) {
      alphaNum += stringPool.charAt(Math.floor(Math.random() * stringPool.length));
    }
    return alphaNum.toUpperCase();
  }
  
  module.exports = {
      generate
  };