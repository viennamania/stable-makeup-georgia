import { Inter } from "next/font/google";
import "@/app/globals.css";


//const inter = Inter({ subsets: ["latin"] });

import localFont from "next/font/local";

const pretendard = localFont({
  src: "../../../static/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (


    <html lang="ko" className={`${pretendard.variable}`}>
      {/*
    <html lang="en">
    */}


        {/*}
      <body className={inter.className}>{children}</body>
      */}

      <body className={pretendard.className}>
        {children}
      </body>


    </html>
  );
}
