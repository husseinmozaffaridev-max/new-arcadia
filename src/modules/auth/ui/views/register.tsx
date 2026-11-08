"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
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
import { useRegister } from "../clients/register";
import { useRegisterTranslations } from "../hooks/use-translations";
import { type RegisterFormValues, registerSchema } from "../schemas/register";

export function RegisterView() {
  const t = useRegisterTranslations();

  const fields: FieldDef[] = [
    {
      name: "name",
      label: t("fullName"),
      type: "text",
      autoComplete: "name",
    },
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
      autoComplete: "new-password",
    },
  ];

  const form = useForm<RegisterFormValues>({
    mode: "onChange",
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", password: "" },
  });

  const router = useRouter();

  const register = useRegister();

  const handleSubmit: SubmitHandler<RegisterFormValues> = useCallback(
    (values) => {
      register.mutate(values, {
        onError(error) {
          toast.error(error?.message);
        },
        onSuccess() {
          router.replace("/dashboard/project");
        },
      });
    },
    [register, router],
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
              loading={register.isPending}
              className="w-full gap-2 mt-1"
            >
              <UserPlus className="h-4 w-4" />
              {t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("hasAccount")}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium ms-1"
          >
            {t("signInLink")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
