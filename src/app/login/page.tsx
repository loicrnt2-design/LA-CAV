import Link from "next/link";
import { getT } from "@/lib/locale";
import { AuthForm } from "@/components/AuthForm";
import { login } from "../actions";

export default async function Login() {
  const { t } = await getT();
  return (
    <>
      <h1>{t("auth.login")}</h1>
      <AuthForm action={login} labels={{ email: t("auth.email"), password: t("auth.password"), submit: t("auth.login"), error: t("auth.error") }} />
      <p><Link href="/register">{t("auth.register")}</Link></p>
    </>
  );
}
