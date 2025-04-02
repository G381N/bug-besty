let data;
try {
  data = await response.json();
} catch (error) {
  console.error("Failed to parse response as JSON:", await response.text());
  // Handle gracefully - show error message to user
  return { error: "Server error. Please try again." };
} 