import type { Metadata } from "next";
import { InformationPageLayout } from "@/components/site/legal/information-page-layout";
import { InformationSection } from "@/components/site/legal/information-section";
export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Read the terms and conditions governing use of the Knowledge Nest website.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};
export default function TermsAndConditionsPage() {
  return (
    <InformationPageLayout
      title="Terms and Conditions"
      description="These terms describe the conditions that apply when accessing and using Knowledge Nest."
    >
      <InformationSection
        title="Acceptance of Terms"
        paragraphs={[
          "By accessing Knowledge Nest, you agree to use the website according to these terms and all applicable laws.",
          "You should stop using the website if you do not agree with these conditions.",
        ]}
      />
      <InformationSection
        title="Educational Use"
        paragraphs={[
          "Website content is provided for general educational and informational purposes.",
          "No article creates a professional, advisory, contractual or confidential relationship between Knowledge Nest and the reader.",
        ]}
      />
      <InformationSection
        title="Acceptable Use"
        paragraphs={[
          "You must not attempt to damage, disrupt, overload, copy unlawfully or gain unauthorized access to the website or its systems.",
          "Automated collection, reproduction or redistribution of website content may not be performed in violation of applicable law or intellectual property rights.",
        ]}
      />
      <InformationSection
        title="Content Accuracy"
        paragraphs={[
          "Reasonable efforts may be made to maintain useful and accurate information, but completeness, accuracy and availability are not guaranteed.",
          "Content may be edited, removed or updated without prior notice.",
        ]}
      />
      <InformationSection
        title="External Services"
        paragraphs={[
          "Knowledge Nest may link to third-party websites or services for reference or convenience.",
          "The availability, security, accuracy and policies of those services remain the responsibility of their respective operators.",
        ]}
      />
      <InformationSection
        title="Changes to These Terms"
        paragraphs={[
          "These terms may be updated when the website, applicable requirements or operating practices change.",
          "Continued use after an update indicates acceptance of the revised terms.",
        ]}
      />
    </InformationPageLayout>
  );
}
