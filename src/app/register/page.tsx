import Link from "next/link";
import { getT } from "@/lib/locale";
import { AuthForm } from "@/components/AuthForm";
import { register } from "../actions";

export default async function Register() {
  const { t } = await getT();
  return (
    <>
      <h1>{t("auth.register")}</h1>
      <AuthForm
        register
        action={register}
        labels={{ email: t("auth.email"), password: t("auth.password"), name: t("auth.name"), terms: t("auth.acceptTerms"), submit: t("auth.register"), error: t("auth.error") }}
      />
      <p><Link href="/login">{t("auth.login")}</Link> · <Link href="/legal">{t("nav.legal")}</Link></p>
    </>
  );
}
