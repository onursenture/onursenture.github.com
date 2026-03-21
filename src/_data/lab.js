module.exports = async function () {
  try {
    const res = await fetch("https://lab.onursenture.com/api/projects");
    const data = await res.json();
    return data.projects || [];
  } catch (e) {
    console.warn("[data] Failed to fetch lab projects:", e.message);
    return [];
  }
};
