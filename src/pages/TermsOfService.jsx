import React from "react";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-slate-800">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="mb-4">
        Last updated: {new Date().getFullYear()}
      </p>

      <p className="mb-6">
        By accessing or using maplebar.io, you agree to these Terms of Service.
        If you do not agree, please do not use the site.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Use of the Site</h2>
      <p className="mb-4">
        Maplebar provides online tools for informational and creative purposes only.
        We make no guarantees about accuracy, availability, or results.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Acceptable Use</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>No illegal or abusive use</li>
        <li>No attempts to disrupt or exploit the site</li>
        <li>No reverse engineering or scraping</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Intellectual Property</h2>
      <p className="mb-4">
        All site content, branding, and design belong to Maplebar unless otherwise stated.
        You may not reuse or redistribute without permission.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Third-Party Links</h2>
      <p className="mb-4">
        The site may link to third-party websites. We are not responsible for their content
        or practices.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer</h2>
      <p className="mb-4">
        The site is provided “as is” without warranties of any kind.
        Use at your own risk.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Limitation of Liability</h2>
      <p className="mb-4">
        Maplebar is not liable for any damages arising from use of the site.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Changes</h2>
      <p className="mb-4">
        We may update these terms at any time. Continued use constitutes acceptance.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>
        Questions? Contact us at:
        <br />
        <strong>contact@maplebar.io</strong>
      </p>
    </div>
  );
}
