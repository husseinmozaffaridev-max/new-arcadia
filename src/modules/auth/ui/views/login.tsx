"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCallback } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type FieldDef,
  FieldRenderer,
} from "@/modules/shared/ui/components/common/field-renderer";
import { Button } from "@/modules/shared/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/modules/shared/ui/components/ui/card";
import { Form } from "@/modules/shared/ui/components/ui/form";
import { useLogin } from "../clients/login";
import { useLoginTranslations } from "../hooks/use-translations";
import { type LoginFormValues, loginSchema } from "../schemas/login";

export function LoginView() {
  const t = useLoginTranslations();

  const fields: FieldDef[] = [
    {
      name: "username",
      label: t("username"),
      type: "text",
      dir: "ltr",
      autoComplete: "username",
    },
    {
      name: "password",
      label: t("password"),
      type: "password",
      placeholder: "********",
      autoComplete: "current-password",
    },
  ];

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const login = useLogin();

  const router = useRouter();

  const handleSubmit: SubmitHandler<LoginFormValues> = useCallback(
    (values) => {
      login.mutate(values, {
        onError(error) {
          toast.error(error.message);
        },
        onSuccess() {
          router.replace("/dashboard/project");
        },
      });
    },
    [login, router],
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-2xl font-black text-primary">A</span>
        </div>
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FieldRenderer fields={fields} />
            <Button
              type="submit"
              loading={login.isPending}
              className="w-full gap-2 mt-1"
            >
              <LogIn className="h-4 w-4" />
              {t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("noAccount")}
          <Link
            href="/auth/register"
            className="text-primary hover:underline font-medium ms-1"
          >
            {t("registerLink")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
