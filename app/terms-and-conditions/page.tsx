import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <main style={{minHeight:"100vh",background:"#0b0b0b",color:"#f7f4ee",padding:"48px 20px"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div>
          <p style={{color:"#e83b18",fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",fontSize:12}}>Legal</p>
          <h1 style={{fontSize:"clamp(3rem,8vw,6rem)",lineHeight:.92,letterSpacing:"-.06em",margin:"12px 0 0"}}>Terms and Conditions</h1>
          <p style={{color:"#aaa",lineHeight:1.7,maxWidth:720}}>These Terms govern your use of the Nasty Burger House website and any pickup order you place through it.</p>
          <p style={{color:"#777",fontSize:13}}>Last updated: 4 September 2026</p>
        </div>

        <div style={{display:"grid",gap:16,marginTop:40}}>
          {[
            ["1. Using this website", <><p>By using this website or placing an order, you agree to these Terms. You must use the website lawfully and must not interfere with its operation, security or other users.</p></>],
            ["2. Orders", <><p>An order request is not final until it has been accepted by Nasty Burger House. We may decline or cancel an order where an item is unavailable, a price or system error has occurred, the order cannot reasonably be fulfilled, or we suspect misuse or fraud.</p><p>Pickup times are estimates and may change depending on demand, preparation requirements and operational conditions.</p></>],
            ["3. Prices and availability", <><p>Prices are shown in Australian dollars unless stated otherwise. Menu items, prices, promotions and availability may change without notice. If there is a clear pricing or description error, we may contact you before fulfilling the order or cancel the affected item.</p></>],
            ["4. Cancellations, refunds and consumer rights", <><p>If you need to change or cancel an order, contact us as soon as possible. Once food preparation has started, cancellation or refund options may be limited where permitted by law.</p><p>Nothing in these Terms excludes, restricts or modifies any rights or remedies that cannot lawfully be excluded, including rights under the Australian Consumer Law.</p></>],
            ["5. Allergens and dietary information", <><p>Menu descriptions and dietary information are provided in good faith. Our food may be prepared in environments where allergens are present, and cross-contact can occur. If you have an allergy or dietary requirement, contact us before ordering so we can provide the most relevant available information.</p></>],
            ["6. Promotions and Drip Points", <><p>Promotions, rewards and Drip Points offers may have separate eligibility rules, expiry dates, exclusions or redemption conditions. Unless stated otherwise, offers cannot be exchanged for cash and may not be combined with other promotions.</p><p>We may correct, suspend or withdraw a promotion or rewards feature where there is an error, misuse or operational reason, subject to applicable law.</p></>],
            ["7. Website availability", <><p>We aim to keep the website available and accurate, but we do not guarantee uninterrupted access. Features may be changed, suspended or unavailable from time to time for maintenance, security, technical or operational reasons.</p></>],
            ["8. Intellectual property", <><p>The Nasty Burger House name, branding, website design, graphics, photographs, copy and other site content are owned by or licensed to Nasty Burger House unless stated otherwise. You may not reproduce or commercially use them without permission except as allowed by law.</p></>],
            ["9. Liability", <><p>To the maximum extent permitted by law, Nasty Burger House is not responsible for indirect or consequential loss arising solely from use of the website. This clause does not limit any liability, guarantee or remedy that cannot legally be limited or excluded.</p></>],
            ["10. Privacy", <><p>Our collection and handling of personal information is described in our Privacy Policy.</p></>],
            ["11. Changes to these Terms", <><p>We may update these Terms to reflect changes to our website, ordering process, services or legal requirements. The current version will be published on this page with its latest update date.</p></>],
            ["12. Contact", <><p>For questions about an order or these Terms, contact Nasty Burger House using the contact details published on our website or in your order confirmation.</p></>],
          ].map(([title, body]) => (
            <section key={String(title)} style={{padding:"24px",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,background:"rgba(255,255,255,.035)",color:"#b8b8b8",lineHeight:1.7}}>
              <h2 style={{color:"white",margin:"0 0 10px",fontSize:18}}>{title}</h2>
              {body}
            </section>
          ))}
        </div>

        <footer style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:48,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <Link href="/" style={{color:"#aaa"}}>Home</Link>
          <Link href="/privacy-policy" style={{color:"#aaa"}}>Privacy Policy</Link>
        </footer>
      </div>
    </main>
  );
}
