import React from "react";
import { Button } from "@/components/ui/button"; // Assuming you have a button component
import { Input } from "@/components/ui/input"; // Assuming you have an input component
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"; // Assuming you have card components
// for commit
const ApiRequest = ({ title, method, url, placeholderKey }) => {
  const highlightedUrl = url.replace(
    placeholderKey,
    `<span class="text-blue-600 font-medium">${placeholderKey}</span>`,
  );

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-md border border-gray-200">
        <span className="bg-gray-200 text-gray-700 font-mono text-xs px-2.5 py-1 rounded uppercase tracking-wider">
          {method}
        </span>
        <code
          className="flex-1 text-sm text-gray-700 break-all"
          dangerouslySetInnerHTML={{ __html: highlightedUrl }}
        />
        <div className="flex items-center gap-2 text-gray-500">
          {/* Replace with your copy icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 cursor-pointer hover:text-gray-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
            />
          </svg>
          {/* Replace with your external link icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 cursor-pointer hover:text-gray-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const ApiKeysSection = () => {
  // This state would hold actual API key data in a real application
  const apiKeys = [
    {
      id: 1,
      name: "Development Key",
      key: "gp_dev_abc123...",
      created: "2023-10-27",
    },
    {
      id: 2,
      name: "Production Key",
      key: "gp_prod_xyz789...",
      created: "2023-11-15",
    },
  ];

  return (
    <Card className="mb-10 shadow-sm border border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-100 mb-6">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-950">
            API secret keys
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 mt-1 max-w-2xl">
            Your API keys are like your passwords: make sure to always keep them
            hidden! Share them only with services you trust.
          </CardDescription>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-medium rounded-md shadow-sm">
          New key
        </Button>
      </CardHeader>
      <CardContent>
        {/* Placeholder table for actual API keys */}
        <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left font-medium text-gray-600 tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left font-medium text-gray-600 tracking-wider"
                >
                  Secret key
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left font-medium text-gray-600 tracking-wider"
                >
                  Created
                </th>
                <th scope="col" className="relative px-5 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                    {key.name}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-gray-700">
                    {key.key}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {key.created}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium">
                    <button className="text-gray-500 hover:text-gray-700 mr-4">
                      Revoke
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const ApiOverviewSection = () => {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader className="pb-6 border-b border-gray-100 mb-8">
        <CardTitle className="text-xl font-semibold text-gray-950">
          API overview
        </CardTitle>
        <CardDescription className="text-sm text-blue-600 mt-1 cursor-pointer hover:text-blue-700 font-medium">
          Full documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-10 font-medium">
          Most used API requests:
        </p>

        <ApiRequest
          title="Find Email"
          method="GET"
          url="https://api.getprospect.com/v2/email-finder?domain=getprospect.com&full_name=Dmytro Shulha&api_key=YOUR_TOKEN"
          placeholderKey="YOUR_TOKEN"
        />
        <ApiRequest
          title="Verify Email"
          method="GET"
          url="https://api.getprospect.com/v2/email-verifier?email=support@getprospect.com&api_key=YOUR_TOKEN"
          placeholderKey="YOUR_TOKEN"
        />
        <ApiRequest
          title="Find Contact by Linkedin URL"
          method="GET"
          url="https://api.getprospect.com/public/v1/insights/contact?linkedinUrl=https://www.linkedin.com/in/alona-shalieieva-49&api_key=YOUR_TOKEN"
          placeholderKey="YOUR_TOKEN"
        />
      </CardContent>
    </Card>
  );
};

const API = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Simple Top Navigation Placeholder */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 shadow-sm mb-10">
        <h1 className="text-2xl font-semibold text-gray-950">API</h1>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pb-16">
        <ApiKeysSection />
        <ApiOverviewSection />
      </main>
    </div>
  );
};

export default API;
