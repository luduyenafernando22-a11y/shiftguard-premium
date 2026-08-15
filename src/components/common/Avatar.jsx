import React from "react";
import { getInitials } from "../../data/models";

export default function Avatar({ employee, size = 38 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (employee.avatarDataUrl) {
    return (
      <img
        className="avatar avatar-photo"
        style={style}
        src={employee.avatarDataUrl}
        alt={employee.fullName}
      />
    );
  }

  return (
    <div className="avatar avatar-initials" style={style}>
      {getInitials(employee.fullName)}
    </div>
  );
}
