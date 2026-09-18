export const BigIntSerealizer = function () 
{
  return BigInt.prototype.toJSON = function () 
  {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
  };
  
};
