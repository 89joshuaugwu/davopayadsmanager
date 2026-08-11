interface Props {
  variant?: "light" | "dark";
}

export default function Footer({ variant = "light" }: Props) {
  const isDark = variant === "dark";

  return (
    <footer className={`no-print py-6 px-4 text-center ${isDark ? "text-white/40" : "text-davo-muted"}`}>
      <p className="text-xs">
        DavoPay Ads Manager · by DavoPay Software · Developer:{" "}
        <span className={isDark ? "text-white/60 font-medium" : "text-davo-navy font-medium"}>
          Joshuazaza
        </span>
      </p>
    </footer>
  );
}
