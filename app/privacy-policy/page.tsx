import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main style={{minHeight:"100vh",background:"#0b0b0b",color:"#f7f4ee",padding:"48px 20px"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div>
          <p style={{color:"#e83b18",fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",fontSize:12}}>Legal</p>
          <h1 style={{fontSize:"clamp(3rem,8vw,6rem)",lineHeight:.92,letterSpacing:"-.06em",margin:"12px 0 0"}}>Privacy Policy</h1>
          <p style={{color:"#aaa",lineHeight:1.7,maxWidth:720}}>This Privacy Policy explains how Nasty Burger House handles personal information when you browse our website, join Drip Points or place a pickup order.</p>
          <p style={{color:"#777",fontSize:13}}>Last updated: 4 September 2026</p>
        </div>

        <div style={{display:"grid",gap:16,marginTop:40}}>
          {[
            ["1. Information we collect", <><p>We may collect information you provide directly to us, including your name, email address, phone number, order details, pickup preferences, notes and information submitted when joining Drip Points.</p><p>Our website may also store limited information in your browser, such as your cart and rewards signup status, so that the ordering experience works correctly.</p></>],
            ["2. How we use your information", <><p>We use personal information to process and manage pickup orders, contact you about your order, operate Drip Points, respond to enquiries, improve our website and services, prevent misuse and meet legal obligations.</p></>],
            ["3. Browser storage and cookies", <><p>We may use browser technologies such as local storage, session storage or cookies where needed for site functionality, preferences, security or analytics. You can control cookies through your browser settings, although disabling some storage may affect website features.</p></>],
            ["4. Sharing your information", <><p>We may share information with service providers that help us operate the website, communications, hosting, ordering or other business systems. We do not sell your personal information.</p><p>If a service provider processes information outside Australia, we will take reasonable steps to handle that information appropriately and provide further details where required.</p></>],
            ["5. Data security and retention", <><p>We take reasonable steps to protect personal information from misuse, interference, loss and unauthorised access, modification or disclosure. We keep information only for as long as reasonably needed for the purpose it was collected, business records, dispute handling or legal requirements.</p></>],
            ["6. Access and correction", <><p>You may ask to access personal information we hold about you or request a correction if you believe it is inaccurate, out of date, incomplete, irrelevant or misleading.</p></>],
            ["7. Privacy enquiries and complaints", <><p>If you have a privacy question, access request, correction request or complaint, contact Nasty Burger House using the contact details published on our website or in your order confirmation. We will review and respond to privacy concerns within a reasonable period.</p></>],
            ["8. Changes to this policy", <><p>We may update this Privacy Policy when our services, technology or information-handling practices change. The latest version will be published on this page with an updated date.</p></>],
          ].map(([title, body]) => (
            <section key={String(title)} style={{padding:"24px",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,background:"rgba(255,255,255,.035)",color:"#b8b8b8",lineHeight:1.7}}>
              <h2 style={{color:"white",margin:"0 0 10px",fontSize:18}}>{title}</h2>
              {body}
            </section>
          ))}
        </div>

        <footer style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:48,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <Link href="/" style={{color:"#aaa"}}>Home</Link>
          <Link href="/terms-and-conditions" style={{color:"#aaa"}}>Terms and Conditions</Link>
        </footer>
      </div>
    </main>
  );
}
