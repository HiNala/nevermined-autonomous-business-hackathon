import { redirect } from "next/navigation";

export const metadata = {
  title: "Research — Auto Business",
  description: "Run web research requests and get structured intelligence documents.",
};

export default function Page() {
  redirect("/studio?mode=researcher");
}
