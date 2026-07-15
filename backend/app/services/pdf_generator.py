"""PDF generation for LeadForge growth reports."""
import io
import os
from datetime import datetime
from typing import Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas


# ─── Brand Colours ────────────────────────────────────────────────────────────
BRAND_DARK = colors.HexColor("#0F172A")
BRAND_BLUE = colors.HexColor("#3B82F6")
BRAND_LIGHT_BLUE = colors.HexColor("#EFF6FF")
BRAND_GREEN = colors.HexColor("#10B981")
BRAND_AMBER = colors.HexColor("#F59E0B")
BRAND_RED = colors.HexColor("#EF4444")
BRAND_GREY = colors.HexColor("#6B7280")
BRAND_LIGHT = colors.HexColor("#F8FAFC")
WHITE = colors.white
BLACK = colors.black


class LeadForgePDFGenerator:
    """Generates a professional branded PDF growth report."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()

    def _setup_styles(self):
        """Define custom paragraph styles."""
        self.h1 = ParagraphStyle(
            "LFH1", parent=self.styles["Heading1"],
            fontSize=28, textColor=WHITE, fontName="Helvetica-Bold",
            spaceAfter=6, leading=34,
        )
        self.h2 = ParagraphStyle(
            "LFH2", parent=self.styles["Heading2"],
            fontSize=18, textColor=BRAND_DARK, fontName="Helvetica-Bold",
            spaceBefore=12, spaceAfter=6, leading=22,
        )
        self.h3 = ParagraphStyle(
            "LFH3", parent=self.styles["Heading3"],
            fontSize=13, textColor=BRAND_BLUE, fontName="Helvetica-Bold",
            spaceBefore=8, spaceAfter=4, leading=17,
        )
        self.body = ParagraphStyle(
            "LFBody", parent=self.styles["Normal"],
            fontSize=10, textColor=BRAND_DARK, fontName="Helvetica",
            spaceAfter=6, leading=15,
        )
        self.caption = ParagraphStyle(
            "LFCaption", parent=self.styles["Normal"],
            fontSize=8, textColor=BRAND_GREY, fontName="Helvetica",
            spaceAfter=4, leading=11,
        )
        self.bullet = ParagraphStyle(
            "LFBullet", parent=self.styles["Normal"],
            fontSize=10, textColor=BRAND_DARK, fontName="Helvetica",
            spaceAfter=4, leading=14, leftIndent=12, bulletIndent=0,
            bulletText="•",
        )
        self.section_label = ParagraphStyle(
            "LFSectionLabel", parent=self.styles["Normal"],
            fontSize=9, textColor=BRAND_BLUE, fontName="Helvetica-Bold",
            spaceAfter=2, leading=12, textTransform="uppercase",
        )

    def _score_color(self, score: int) -> colors.Color:
        if score >= 70:
            return BRAND_GREEN
        elif score >= 40:
            return BRAND_AMBER
        return BRAND_RED

    def _bullet_items(self, items: list, style=None) -> list:
        s = style or self.bullet
        return [Paragraph(f"• {item}", s) for item in items if item]

    def _section_header(self, title: str, subtitle: Optional[str] = None) -> list:
        elems = [
            HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=6),
            Paragraph(title, self.h2),
        ]
        if subtitle:
            elems.append(Paragraph(subtitle, self.body))
        elems.append(Spacer(1, 4))
        return elems

    def generate(
        self,
        project_name: str,
        business_name: str,
        service_type: str,
        service_area: str,
        business_analysis: dict,
        seo_strategy: dict,
        content_plan: dict,
        lead_conversion: dict,
        growth_plan: dict,
        growth_score: int = 65,
    ) -> bytes:
        """Generate the full PDF and return as bytes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=15*mm,
            bottomMargin=15*mm,
            leftMargin=18*mm,
            rightMargin=18*mm,
        )

        story = []
        story += self._cover_page(business_name, service_type, service_area, growth_score)
        story.append(PageBreak())
        story += self._executive_summary(business_analysis, growth_plan, growth_score)
        story.append(PageBreak())
        story += self._seo_section(seo_strategy)
        story.append(PageBreak())
        story += self._content_section(content_plan)
        story.append(PageBreak())
        story += self._campaigns_section(lead_conversion)
        story.append(PageBreak())
        story += self._growth_roadmap(growth_plan)

        def on_page(canvas_obj, doc_obj):
            self._add_footer(canvas_obj, doc_obj, business_name)

        doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
        return buffer.getvalue()

    def _cover_page(self, business_name, service_type, service_area, growth_score):
        """Dark branded cover page."""
        elems = []
        # Dark header block via a table background
        header_data = [[
            Paragraph("LEADFORGE AI", ParagraphStyle(
                "cover_tag", fontSize=11, textColor=BRAND_BLUE,
                fontName="Helvetica-Bold", spaceAfter=4
            )),
        ]]
        header_table = Table(header_data, colWidths=[174*mm])
        header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
            ("TOPPADDING", (0, 0), (-1, -1), 30),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ]))
        elems.append(header_table)

        # Main title block
        title_data = [[
            Paragraph(
                f"<b>Customer Acquisition<br/>Growth Report</b>",
                ParagraphStyle("cover_h1", fontSize=26, textColor=WHITE,
                    fontName="Helvetica-Bold", leading=32)
            )
        ]]
        title_table = Table(title_data, colWidths=[174*mm])
        title_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
            ("TOPPADDING", (0, 0), (-1, -1), 20),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
            ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ]))
        elems.append(title_table)

        # Business info block
        info_data = [[
            Paragraph(business_name, ParagraphStyle(
                "cover_biz", fontSize=20, textColor=BRAND_BLUE,
                fontName="Helvetica-Bold"
            ))
        ], [
            Paragraph(f"{service_type.title()} · {service_area}", ParagraphStyle(
                "cover_info", fontSize=12, textColor=BRAND_GREY, fontName="Helvetica"
            ))
        ], [
            Paragraph(
                f"Prepared on {datetime.now().strftime('%d %B %Y')}",
                ParagraphStyle("cover_date", fontSize=10, textColor=BRAND_GREY, fontName="Helvetica")
            )
        ]]
        info_table = Table(info_data, colWidths=[174*mm])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ]))
        elems.append(info_table)

        # Growth score
        score_color = self._score_color(growth_score)
        score_data = [[
            Paragraph("GROWTH SCORE", ParagraphStyle(
                "score_label", fontSize=10, textColor=BRAND_GREY,
                fontName="Helvetica-Bold", alignment=TA_CENTER
            )),
            Paragraph(f"<b>{growth_score}/100</b>", ParagraphStyle(
                "score_value", fontSize=36, textColor=score_color,
                fontName="Helvetica-Bold", alignment=TA_CENTER
            )),
            Paragraph(
                "Your business has significant<br/>growth potential. This report<br/>shows you exactly how to capture it.",
                ParagraphStyle("score_desc", fontSize=10, textColor=BRAND_GREY,
                    fontName="Helvetica", leading=14)
            ),
        ]]
        score_table = Table(score_data, colWidths=[50*mm, 62*mm, 62*mm])
        score_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 20),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (1, -1), "CENTER"),
        ]))
        elems.append(score_table)
        elems.append(Spacer(1, 8*mm))

        # What's inside
        elems.append(Paragraph("What's inside this report", self.h3))
        sections = [
            ("01", "Business Analysis", "SWOT, ideal customers, and unique selling points"),
            ("02", "SEO Strategy", "Keywords, competitor analysis, and Google Business"),
            ("03", "Content Calendar", "30 days of social posts, blogs, and GBP updates"),
            ("04", "Email Campaigns", "Follow-up sequences, review requests, re-engagement"),
            ("05", "90-Day Growth Plan", "Weekly checklists, KPIs, and revenue projections"),
        ]
        toc_data = [[
            Paragraph(f"<b>{n}</b>", ParagraphStyle("toc_n", fontSize=14, textColor=BRAND_BLUE, fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<b>{t}</b><br/><font color='#6B7280' size='9'>{d}</font>", ParagraphStyle("toc_t", fontSize=11, fontName="Helvetica-Bold", leading=16))
        ] for n, t, d in sections]
        toc = Table(toc_data, colWidths=[20*mm, 154*mm])
        toc.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, BRAND_LIGHT]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elems.append(toc)
        return elems

    def _executive_summary(self, analysis: dict, growth_plan: dict, score: int):
        elems = self._section_header("01 — Business Analysis", "A strategic overview of your business position")
        summary = analysis.get("summary", "Business analysis complete.")
        elems.append(Paragraph(summary, self.body))
        elems.append(Spacer(1, 4))

        # SWOT table
        swot_data = [
            [
                Paragraph("<b>💪 Strengths</b>", ParagraphStyle("swot_h", fontSize=11, fontName="Helvetica-Bold", textColor=BRAND_GREEN)),
                Paragraph("<b>⚠️ Weaknesses</b>", ParagraphStyle("swot_h", fontSize=11, fontName="Helvetica-Bold", textColor=BRAND_AMBER)),
            ],
            [
                "\n".join([f"• {s}" for s in analysis.get("strengths", [])[:4]]),
                "\n".join([f"• {w}" for w in analysis.get("weaknesses", [])[:4]]),
            ],
            [
                Paragraph("<b>🚀 Opportunities</b>", ParagraphStyle("swot_h", fontSize=11, fontName="Helvetica-Bold", textColor=BRAND_BLUE)),
                Paragraph("<b>🛡 Threats</b>", ParagraphStyle("swot_h", fontSize=11, fontName="Helvetica-Bold", textColor=BRAND_RED)),
            ],
            [
                "\n".join([f"• {o}" for o in analysis.get("opportunities", [])[:4]]),
                "\n".join([f"• {t}" for t in analysis.get("threats", [])[:4]]),
            ],
        ]
        swot = Table(swot_data, colWidths=[87*mm, 87*mm])
        swot.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#F0FDF4")),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FFFBEB")),
            ("BACKGROUND", (0, 2), (0, 2), colors.HexColor("#EFF6FF")),
            ("BACKGROUND", (1, 2), (1, 2), colors.HexColor("#FEF2F2")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("FONTSIZE", (0, 1), (-1, 1), 9),
            ("FONTSIZE", (0, 3), (-1, 3), 9),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        elems.append(swot)
        elems.append(Spacer(1, 8))

        # USPs
        elems.append(Paragraph("Your Unique Selling Points", self.h3))
        for usp in analysis.get("unique_selling_propositions", []):
            elems.append(Paragraph(f"✓ {usp}", self.bullet))

        # Priority actions
        elems.append(Paragraph("Priority Actions", self.h3))
        for i, action in enumerate(analysis.get("priority_actions", []), 1):
            elems.append(Paragraph(f"{i}. {action}", self.body))

        return elems

    def _seo_section(self, seo: dict):
        elems = self._section_header("02 — SEO Strategy", "Local search optimisation to get found by customers")

        # Primary keywords table
        elems.append(Paragraph("Primary Target Keywords", self.h3))
        kw_data = [["Keyword", "Monthly Searches", "Difficulty", "Intent"]]
        for kw in seo.get("primary_keywords", [])[:5]:
            kw_data.append([
                kw.get("keyword", ""),
                str(kw.get("monthly_searches", "")),
                kw.get("difficulty", "").title(),
                kw.get("intent", "").title(),
            ])
        kw_table = Table(kw_data, colWidths=[80*mm, 36*mm, 28*mm, 30*mm])
        kw_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ]))
        elems.append(kw_table)
        elems.append(Spacer(1, 8))

        # GBP improvements
        gbp = seo.get("google_business_profile", {})
        elems.append(Paragraph("Google Business Profile Improvements", self.h3))
        for imp in gbp.get("improvements", [])[:5]:
            impact = imp.get("impact", "")
            color_map = {"high": "🟢", "medium": "🟡", "low": "⚪"}
            icon = color_map.get(impact, "•")
            elems.append(Paragraph(
                f"{icon} <b>{imp.get('action', '')}</b> — Impact: {impact.title()}, Effort: {imp.get('effort', '').title()}",
                self.body
            ))

        # Local keywords
        elems.append(Paragraph("Local Keyword Opportunities", self.h3))
        loc_data = [["Keyword", "Monthly Searches", "Opportunity Score"]]
        for kw in seo.get("local_keyword_opportunities", [])[:6]:
            loc_data.append([
                kw.get("keyword", ""),
                str(kw.get("monthly_searches", "")),
                f"{kw.get('opportunity_score', '')}/10",
            ])
        loc_table = Table(loc_data, colWidths=[100*mm, 40*mm, 34*mm])
        loc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ]))
        elems.append(loc_table)
        elems.append(Spacer(1, 8))

        # Technical SEO checklist
        elems.append(Paragraph("Technical SEO Checklist", self.h3))
        for item in seo.get("technical_seo_checklist", [])[:6]:
            priority = item.get("priority", "medium")
            icons = {"high": "🔴", "medium": "🟡", "low": "🟢"}
            elems.append(Paragraph(f"{icons.get(priority, '•')} {item.get('item', '')}", self.body))

        return elems

    def _content_section(self, content: dict):
        elems = self._section_header("03 — Content Calendar", "30 days of content to build your online presence")

        cal = content.get("content_calendar", {})
        elems.append(Paragraph(cal.get("overview", ""), self.body))

        # Weekly themes
        elems.append(Paragraph("Weekly Themes", self.h3))
        for theme in cal.get("weekly_themes", []):
            elems.append(Paragraph(f"• {theme}", self.bullet))
        elems.append(Spacer(1, 6))

        # Sample social posts
        elems.append(Paragraph("Sample Social Media Posts", self.h3))
        for post in content.get("social_posts", [])[:6]:
            platform = post.get("platform", "").title()
            week = post.get("week", "")
            day = post.get("day", "")
            post_content = post.get("content", "")[:200] + ("..." if len(post.get("content", "")) > 200 else "")
            box_data = [[
                Paragraph(f"<b>{platform}</b> · Week {week} · {day}", self.caption),
            ], [
                Paragraph(post_content, self.body),
            ]]
            box = Table(box_data, colWidths=[174*mm])
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_LIGHT),
                ("BACKGROUND", (0, 1), (-1, 1), WHITE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ]))
            elems.append(box)
            elems.append(Spacer(1, 4))

        # Blog ideas
        elems.append(Paragraph("Blog Content Ideas", self.h3))
        blog_data = [["#", "Blog Title", "Target Keyword", "Week"]]
        for i, blog in enumerate(content.get("blog_ideas", [])[:8], 1):
            blog_data.append([
                str(i),
                blog.get("title", "")[:50],
                blog.get("target_keyword", ""),
                f"W{blog.get('week', '')}",
            ])
        blog_table = Table(blog_data, colWidths=[8*mm, 100*mm, 46*mm, 14*mm])
        blog_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ]))
        elems.append(blog_table)

        # Landing page copy
        lp = content.get("landing_page_copy", {})
        if lp:
            elems.append(Spacer(1, 8))
            elems.append(Paragraph("Landing Page Copy", self.h3))
            lp_data = [
                [Paragraph("<b>Headline</b>", self.caption), Paragraph(lp.get("headline", ""), self.body)],
                [Paragraph("<b>Subheadline</b>", self.caption), Paragraph(lp.get("subheadline", ""), self.body)],
                [Paragraph("<b>CTA Button</b>", self.caption), Paragraph(lp.get("hero_cta", ""), self.body)],
            ]
            lp_table = Table(lp_data, colWidths=[30*mm, 144*mm])
            lp_table.setStyle(TableStyle([
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BRAND_LIGHT, WHITE]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
            ]))
            elems.append(lp_table)

        return elems

    def _campaigns_section(self, lead: dict):
        elems = self._section_header("04 — Email Campaigns & Follow-Up Sequences", "Convert enquiries into paying customers")

        # Quote follow-up
        elems.append(Paragraph("Quote Follow-Up Sequence", self.h3))
        for step in lead.get("quote_follow_up_sequence", []):
            delay = step.get("delay_days", 0)
            timing = "Send immediately" if delay == 0 else f"Day {delay}"
            box_data = [[
                Paragraph(f"<b>Step {step.get('sequence_order', '')} · {timing}</b>", self.caption),
                Paragraph(f"Goal: {step.get('goal', '')}", self.caption),
            ], [
                Paragraph(f"<b>Subject:</b> {step.get('subject', '')}", self.body),
                Paragraph("", self.body),
            ], [
                Paragraph(step.get("content", "")[:300] + "...", self.body),
                Paragraph("", self.body),
            ]]
            box = Table(box_data, colWidths=[100*mm, 74*mm])
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_LIGHT_BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("SPAN", (0, 1), (1, 1)),
                ("SPAN", (0, 2), (1, 2)),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_BLUE),
            ]))
            elems.append(box)
            elems.append(Spacer(1, 5))

        # Review requests
        elems.append(Paragraph("Review Request Templates", self.h3))
        for template in lead.get("review_request_templates", []):
            elems.append(Paragraph(
                f"<b>{template.get('timing', '')} · {template.get('channel', '')}</b>",
                self.section_label
            ))
            elems.append(Paragraph(template.get("content", "")[:250] + "...", self.body))
            elems.append(Spacer(1, 4))

        # SMS
        elems.append(Paragraph("SMS Templates", self.h3))
        sms_data = [["Use Case", "Message"]]
        for sms in lead.get("sms_templates", []):
            sms_data.append([sms.get("use_case", ""), sms.get("content", "")])
        sms_table = Table(sms_data, colWidths=[45*mm, 129*mm])
        sms_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
            ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ]))
        elems.append(sms_table)

        return elems

    def _growth_roadmap(self, growth: dict):
        elems = self._section_header("05 — 90-Day Growth Roadmap", "Your week-by-week action plan to grow revenue")

        # Executive summary
        elems.append(Paragraph(growth.get("executive_summary", ""), self.body))
        elems.append(Spacer(1, 6))

        # Revenue projections
        rev = growth.get("revenue_projections", {})
        if rev:
            elems.append(Paragraph("Revenue Projections", self.h3))
            proj_data = [
                ["Period", "Monthly Revenue", "Growth"],
                ["Current", f"£{rev.get('current_estimated_monthly', 0):,}", "Baseline"],
                ["Month 3", f"£{rev.get('month_3_projected', 0):,}", f"+{int((rev.get('month_3_projected', 0)/max(rev.get('current_estimated_monthly', 1),1)-1)*100)}%"],
                ["Month 6", f"£{rev.get('month_6_projected', 0):,}", f"+{int((rev.get('month_6_projected', 0)/max(rev.get('current_estimated_monthly', 1),1)-1)*100)}%"],
                ["Month 12", f"£{rev.get('month_12_projected', 0):,}", f"+{int((rev.get('month_12_projected', 0)/max(rev.get('current_estimated_monthly', 1),1)-1)*100)}%"],
            ]
            proj_table = Table(proj_data, colWidths=[50*mm, 62*mm, 62*mm])
            proj_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
                ("TEXTCOLOR", (2, 1), (2, 1), BRAND_GREY),
                ("TEXTCOLOR", (2, 2), (2, -1), BRAND_GREEN),
                ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
            ]))
            elems.append(proj_table)
            elems.append(Spacer(1, 8))

        # 90-day plan months
        plan = growth.get("ninety_day_plan", {})
        for month_key in ["month_1", "month_2", "month_3"]:
            month = plan.get(month_key, {})
            if not month:
                continue
            month_num = month_key.replace("month_", "Month ")
            elems.append(Paragraph(f"{month_num.title()}: {month.get('theme', '')}", self.h3))
            elems.append(Paragraph(month.get("focus", ""), self.body))

            # Week tasks
            week_rows = []
            for week in month.get("weeks", []):
                tasks_text = "\n".join([f"☐ {t}" for t in week.get("tasks", [])])
                week_rows.append([
                    Paragraph(f"<b>Week {week.get('week', '')}</b><br/>{week.get('theme', '')}", self.caption),
                    Paragraph(tasks_text, ParagraphStyle("task", fontSize=8, fontName="Helvetica", leading=13)),
                ])

            if week_rows:
                week_table = Table(week_rows, colWidths=[40*mm, 134*mm])
                week_table.setStyle(TableStyle([
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BRAND_LIGHT, WHITE]),
                    ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (0, -1), BRAND_LIGHT),
                ]))
                elems.append(week_table)

            # KPIs
            kpis = month.get("kpis", [])
            if kpis:
                kpi_text = "  ·  ".join([f"✓ {k}" for k in kpis])
                elems.append(Paragraph(f"<b>Month KPIs:</b> {kpi_text}", ParagraphStyle(
                    "kpi", fontSize=8, textColor=BRAND_GREEN, fontName="Helvetica", leading=12, spaceAfter=8
                )))

        # Quick wins
        elems.append(Paragraph("Quick Wins — Start Today", self.h3))
        for win in growth.get("quick_wins", []):
            box_data = [[
                Paragraph(f"⚡ <b>{win.get('action', '')}</b>", self.body),
                Paragraph(f"⏱ {win.get('time_required', '')}", self.caption),
            ], [
                Paragraph(f"Expected: {win.get('expected_impact', '')}", ParagraphStyle(
                    "win_impact", fontSize=9, textColor=BRAND_GREEN, fontName="Helvetica"
                )),
                Paragraph("", self.body),
            ]]
            win_table = Table(box_data, colWidths=[130*mm, 44*mm])
            win_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("SPAN", (0, 1), (1, 1)),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GREEN),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("RIGHTPADDING", (1, 0), (1, 0), 10),
            ]))
            elems.append(win_table)
            elems.append(Spacer(1, 4))

        # Budget
        budget = growth.get("budget_recommendations", {})
        if budget:
            elems.append(Paragraph(f"Recommended Marketing Budget: £{budget.get('monthly_marketing_budget', 500)}/month", self.h3))
            budget_data = [["Channel", "Monthly Budget", "Expected Leads"]]
            for item in budget.get("breakdown", []):
                budget_data.append([item.get("channel", ""), f"£{item.get('amount', 0)}", item.get("expected_leads", "")])
            budget_table = Table(budget_data, colWidths=[80*mm, 40*mm, 54*mm])
            budget_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
            ]))
            elems.append(budget_table)

        return elems

    def _add_footer(self, canvas_obj, doc_obj, business_name):
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(BRAND_GREY)
        canvas_obj.drawString(
            18*mm, 8*mm,
            f"LeadForge AI · Growth Report for {business_name} · Confidential"
        )
        canvas_obj.drawRightString(
            A4[0] - 18*mm, 8*mm,
            f"Page {doc_obj.page}"
        )
        canvas_obj.restoreState()
