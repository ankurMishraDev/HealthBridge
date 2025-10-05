import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative z-10 mt-auto w-full overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 pt-16 pb-0">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary rounded-full blur-xl"></div>
        <div className="absolute top-20 right-1/4 w-16 h-16 bg-primary/30 rounded-full blur-lg"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-secondary/30 rounded-full blur-lg"></div>
      </div>

      <div className="relative w-full">
        <div className="rounded-none border border-border/50 bg-card/80 px-6 pt-8 pb-4 shadow-xl backdrop-blur-sm sm:px-8 md:px-12 md:pt-12 md:pb-6">
          {/* Main Footer Content */}
          <div className="mb-12 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:items-start md:gap-8 md:text-left">
            {/* Brand Section */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex w-fit items-center gap-3 cursor-pointer transition-all duration-300 hover:opacity-80"
            >
              <img src="/Logo.png" alt="AnamAI Logo" className="w-12 h-12" />
              <span className="text-3xl font-bold text-primary">
                {t("footer_AnamAi")}
              </span>
            </motion.div>

            {/* Description */}
            <div className="mx-auto mt-2 max-w-2xl md:mx-0 md:mt-0">
              <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base md:text-left">
                {t("footer_description")}
              </p>
            </div>
          </div>

          {/* Sub-footer */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <p className="text-sm text-muted-foreground">
                {t("footer_copyright")}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("footer_madeWith")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
