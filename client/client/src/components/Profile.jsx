import React from "react";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Profile</h1>
      <p>Template page. Later we can add update profile, password, providers.</p>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        <div><b>Email:</b> {user?.email || "-"}</div>
        <div><b>First name:</b> {user?.first_name || "-"}</div>
        <div><b>Last name:</b> {user?.last_name || "-"}</div>
        <div><b>Provider:</b> {user?.provider || "-"}</div>
      </div>
    </div>
  );
};

export default Profile;