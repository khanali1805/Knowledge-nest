import type { Metadata } from "next";
import { InformationPageLayout } from "@/components/site/legal/information-page-layout";
import { InformationSection } from "@/components/site/legal/information-section";
export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Knowledge Nest and its educational publishing purpose.",
  alternates: {
    canonical: "/about-us",
  },
};
export default function AboutUsPage() {
  return (
    <InformationPageLayout
      title="About Us"
      description="Learn more about the purpose, publishing standards and educational focus of Knowledge Nest."
    >
      <InformationSection
        title="Our Purpose"
        paragraphs={[
          "Knowledge Nest is an educational information website covering finance, science, technology, artificial intelligence, health, education, business, history, environment, space, psychology and general knowledge.",
          "Our purpose is to publish clear and structured articles that help readers understand important topics without unnecessary complexity.",
        ]}
      />
      <InformationSection
        title="Our Publishing Approach"
        paragraphs={[
          "Articles are organized by subject and written for general educational use. We aim to use understandable language, logical structure and useful explanations.",
          "Content may be reviewed, corrected or updated when necessary to improve clarity, accuracy and relevance.",
        ]}
      />
      <InformationSection
        title="Important Notice"
        paragraphs={[
          "The information published on Knowledge Nest is intended for general education and should not replace professional financial, medical, legal or other specialist advice.",
          "Readers should verify important information and consult an appropriate qualified professional before making decisions with serious personal consequences.",
        ]}
      />
    </InformationPageLayout>
  );
}
