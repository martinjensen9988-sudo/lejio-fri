module.exports = async function (context, req) {
  // Logout is just client-side (clear token from localStorage)
  // This endpoint can be called for logging but doesn't need to do anything
  
  context.res = {
    status: 200,
    body: { message: "Logged out successfully" }
  };
  
  return context.res;
};
