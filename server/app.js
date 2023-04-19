import fetch from "node-fetch";

async function getPost() {
  const myPost = await fetch('http://appz.vu.ac.th:8989/VuAPIVer1/select_login.php')
  const response = await myPost.json();
  console.log(response)
}

getPost();
