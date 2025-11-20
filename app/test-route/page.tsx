"use client";

import Link from "next/link";

export default function TestRoute() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Route</h1>
      <p>This is a test page</p>
      <Link href="/purchase-orders/new">
        <button style={{ padding: "10px 20px", cursor: "pointer" }}>
          Go to Purchase Orders New
        </button>
      </Link>
    </div>
  );
}
