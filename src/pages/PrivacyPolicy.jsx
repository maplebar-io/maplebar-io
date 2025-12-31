import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-slate-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        Last updated: {new Date().getFullYear()}
      </p>

      <p className="mb-6">
        Maplebar ("we", "our", or "us") operates the website maplebar.io.
        This Privacy Policy explains how we collect, use, and protect your information.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Information We Collect</h2>
      <p className="mb-4">
        We may collect limited information automatically, including:
      </p>
      <ul className="list-disc ml-6 mb-4">
        <li>IP address</li>
        <li>Browser type and device information</li>
        <li>Pages visited and usage data</li>
      </ul>

      <p className="mb-4">
        We do not require users to create accounts or provide personal information at this time.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Cookies & Advertising</h2>
      <p className="mb-4">
        We use cookies and similar technologies to improve site functionality and display ads.
      </p>
      <p className="mb-4">
        Google AdSense uses cookies (including the DoubleClick cookie) to show ads to users based on
        visits to this and other websites.
      </p>
      <p className="mb-4">
        Users in the European Economic Area (EEA), UK, and Switzerland are shown a consent message
        allowing them to manage or withdraw consent.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Third-Party Services</h2>
      <p className="mb-4">
        We may use third-party services such as Google Analytics and Google AdSense.
        These services may collect information according to their own privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Data Security</h2>
      <p className="mb-4">
        We take reasonable steps to protect your information, but no method of transmission
        over the internet is 100% secure.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Your Rights</h2>
      <p className="mb-4">
        Depending on your location, you may have rights regarding access, correction,
        or deletion of your data.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at:
        <br />
        <strong>contact@maplebar.io</strong>
      </p>
    </div>
  );
}
