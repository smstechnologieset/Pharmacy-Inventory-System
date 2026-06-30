export const generatePasswordFromEmail = (email) => {
  const username = email.split("@")[0];
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${username}@${digits}`;
};
