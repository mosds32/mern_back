
const generateOTP = () =>{
    const min = 1000; // Minimum value (inclusive)
    const max = 9999; // Maximum value (inclusive)
    return Math.floor(min + Math.random() * (max - min + 1));
  };
  
  export default generateOTP;