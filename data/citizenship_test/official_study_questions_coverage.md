# Coverage check — "OTHER STUDY QUESTIONS" (Discover Canada, pp. 108–110)

**Status:** DRAFT FOR REVIEW. Nothing here has been merged into
`question_bank.json` or `web/public/citizenship_test.json`. These are candidate
additions only.

**What this is:** the 28 official "Other Study Questions" printed on pp. 108–110
of Discover Canada, checked one-by-one against the 500-question bank. For the 18
already represented, the matching bank ID is listed. For the 10 not (or only
partially) represented, a full annotated 4-option draft is provided below.

Page numbers cited below are PDF/printed pages (they coincide), matching the
bank's convention.

---

## Coverage table

| # | Official study question (p.) | In bank? | Bank match / note |
|---|------------------------------|----------|-------------------|
| 1 | Name two key documents that contain our rights and freedoms. (108) | **No** | Magna Carta (Q012) and Charter (Q002) exist separately, but no "name the documents" question. → DRAFT-01 |
| 2 | Identify four (4) rights that Canadians enjoy. (108) | **No** | Individual rights tested (Q014, Q219, Q377, Q393, Q015) but no aggregate "name four rights." → DRAFT-02 |
| 3 | Name four (4) fundamental freedoms that Canadians enjoy. (108) | Yes | Q011 (NOT-format on the four freedoms) + Q361, Q362, Q476 |
| 4 | What is meant by the equality of women and men? (108) | Yes | Q016 |
| 5 | Examples of taking responsibility for yourself and your family? (108) | **No** | Q017/Q196 cover *community* / *work*, not the "yourself and your family" framing. → DRAFT-03 |
| 6 | Who were the founding peoples of Canada? (108) | Yes | Q018 |
| 7 | Who are the Métis? (108) | Yes | Q021 |
| 8 | What does the word "Inuit" mean? (108) | Yes | Q020 |
| 9 | What is meant by the term "responsible government"? (108) | **No** | Q005 asks *who* led it; the *definition* isn't tested. → DRAFT-04 |
| 10 | Who was Sir Louis-Hippolyte La Fontaine? (108) | Yes | Q005 (answer is La Fontaine); also Q437 |
| 11 | What did the Canadian Pacific Railway symbolize? (108) | Yes | Q040 |
| 12 | What does Confederation mean? (108) | **No** | Q006/Q427/Q429 cover date/people/levels; the *meaning* of Confederation isn't asked. → DRAFT-05 |
| 13 | Significance of the discovery of insulin (Banting & Best)? (108) | **Partial** | Q090 asks *who* discovered it; the *significance* (saved ~16M lives) isn't tested. → DRAFT-06 |
| 14 | What does it mean that Canada is a constitutional monarchy? (109) | **No** | Q186 asks *which other countries* are; the *definition* isn't tested. → DRAFT-07 |
| 15 | What are the three branches of government? (109) | Yes | Q004 |
| 16 | Difference between the role of the Queen and the PM? (109) | Yes | Q050 (Head of State vs Head of Government) |
| 17 | What is the highest honour that Canadians can receive? (109) | Yes | Q073 |
| 18 | When you go to vote on election day, what do you do? (109) | Yes | Q170 (+ Q310, Q311) |
| 19 | Who is entitled to vote in Canadian federal elections? (109) | Yes | Q055 (+ Q413) |
| 20 | Are you obliged to tell other people how you voted? (109) | Yes | Q056 |
| 21 | After an election, which party forms the government? (109) | Yes | Q058 |
| 22 | Who is your member of Parliament? (109) | **No** | Concept ("the MP elected in your riding") not tested; Q308 only asks *how* an MP is chosen. → DRAFT-08 |
| 23 | What are the three levels of government? (109) | **No** | Q047 = "three key facts"; jurisdiction split tested (Q175–177), but not "federal/provincial/municipal" as the three levels. → DRAFT-09 |
| 24 | What is the role of the courts in Canada? (109) | Yes | Q069 |
| 25 | Are you allowed to question the police about their service or conduct? (109) | Yes | Q068 |
| 26 | Name two Canadian symbols. (109) | **No** | Each symbol tested individually, but no "name two symbols" aggregate. → DRAFT-10 |
| 27 | What provinces are the Atlantic Provinces? (110) | Yes | Q081 |
| 28 | Capital of the province or territory that you live in? (110) | Yes | Q082, Q083, Q097, Q256–Q265 (every capital tested) |

**Summary:** 18/28 already covered, 10/28 missing or only partial → 10 drafts below.

---

## Draft questions (not yet merged)

Schema mirrors `question_bank.json`. Annotation categories:
`CORRECT_ANSWER, RELATED_FACT, PARTIALLY_CORRECT, PLAUSIBLE_DISTRACTOR,
COMMON_MISCONCEPTION, ANACHRONISM, WRONG_CATEGORY`.

---

### DRAFT-01 — covers official #1
**Topic:** rights / charter_of_rights · **Difficulty:** medium · **Source:** Rights and Responsibilities of Citizenship, pp. 11–12

**Q: Which two documents does Discover Canada identify as foundational sources of Canadians' rights and freedoms?**

- ✅ **Magna Carta (1215) and the Canadian Charter of Rights and Freedoms** — `CORRECT_ANSWER` (pp. 11–12). The 800-year tradition of ordered liberty "dates back to the signing of Magna Carta in 1215" (p. 11), and the Constitution was amended in 1982 to entrench the Charter of Rights and Freedoms (p. 12).
- ❌ The Constitution Act, 1867 and the Quebec Act of 1774 — `RELATED_FACT` (pp. 26, 54). Both are real, load-bearing documents, but they concern the *structure of government* and *French civil law*, not the catalogue of rights and freedoms.
- ❌ The Royal Proclamation of 1763 and the Treaty of Paris — `WRONG_CATEGORY` (p. 17). The Royal Proclamation guaranteed *Aboriginal* territorial rights specifically; neither is presented as a general source of Canadians' rights and freedoms.
- ❌ The Official Languages Act and the Canadian Multiculturalism Act — `PARTIALLY_CORRECT` (pp. 12, 83). These protect specific rights, but the guide names the Charter and the Magna-Carta tradition as the key sources of rights and freedoms.

---

### DRAFT-02 — covers official #2
**Topic:** rights / charter_of_rights · **Difficulty:** hard · **Source:** Rights and Responsibilities of Citizenship, p. 12

**Q: Which list correctly names four *rights* set out in the Charter section of Discover Canada?**

- ✅ **Mobility Rights, Aboriginal Peoples' Rights, Official Language Rights, and Multiculturalism** — `CORRECT_ANSWER` (p. 12). These are the four "most important" rights the Charter sets out, per the bulleted list on p. 12.
- ❌ Freedom of conscience and religion; of thought and expression; of peaceful assembly; of association — `RELATED_FACT` (p. 11). These are the four fundamental *freedoms*, not the *rights* — the guide deliberately distinguishes the two. (This is the trap: study question #3 asks for these.)
- ❌ The right to a job, free health care, housing, and post-secondary education — `PLAUSIBLE_DISTRACTOR`. Civic-sounding entitlements, but none are listed as Charter rights in Discover Canada.
- ❌ The right to vote, to a passport, to bear arms, and to free speech — `COMMON_MISCONCEPTION` (p. 12). A passport falls under Mobility Rights and voting is a right, but "the right to bear arms" is a U.S. constitutional concept, not Canadian.

---

### DRAFT-03 — covers official #5
**Topic:** rights / responsibilities_of_citizenship · **Difficulty:** easy · **Source:** Rights and Responsibilities of Citizenship, p. 13

**Q: According to Discover Canada, which is an example of "taking responsibility for oneself and one's family"?**

- ✅ **Getting a job, taking care of one's family, and working hard in keeping with one's abilities** — `CORRECT_ANSWER` (p. 13). Quoted almost verbatim from the "Taking responsibility for oneself and one's family" bullet, which adds that work contributes to dignity, self-respect, and Canada's prosperity.
- ❌ Serving on a jury when you are called to do so — `RELATED_FACT` (p. 13). A genuine citizenship responsibility, but a *separate* listed item, not part of responsibility for oneself and one's family.
- ❌ Volunteering at a food bank or helping newcomers integrate — `RELATED_FACT` (p. 14). This is the "helping others in the community" responsibility — different bullet.
- ❌ Reporting your household income to your local council each year — `PLAUSIBLE_DISTRACTOR`. Not mentioned anywhere in Discover Canada as a responsibility.

---

### DRAFT-04 — covers official #9
**Topic:** history / responsible_government · **Difficulty:** medium · **Source:** From British North America to Confederation, pp. 31–32

**Q: What does the term "responsible government" mean?**

- ✅ **The ministers of the Crown must have the support of a majority of the elected representatives in order to govern** — `CORRECT_ANSWER` (p. 31). Defined word-for-word in the Rebellions of 1837–38 section; p. 32 adds the modern corollary: "if the government loses a confidence vote in the assembly it must resign."
- ❌ A government that is legally accountable to the courts for its spending decisions — `PLAUSIBLE_DISTRACTOR` (p. 75). Conflates accountability-to-the-assembly with the judiciary; courts are covered separately under Canada's justice system.
- ❌ A system in which the Governor General must approve every law the assembly passes — `COMMON_MISCONCEPTION` (p. 55). Royal assent is real, but responsible government is about ministers needing the *elected* assembly's confidence, not about vice-regal approval.
- ❌ The requirement that elected officials behave honestly and avoid corruption — `WRONG_CATEGORY`. A reasonable plain-English guess at "responsible," but not the constitutional meaning the guide gives.

---

### DRAFT-05 — covers official #12
**Topic:** history / confederation · **Difficulty:** medium · **Source:** Confederation, p. 33

**Q: What does "Confederation" mean in Canadian history?**

- ✅ **The union of Nova Scotia, New Brunswick, and the Province of Canada to form a new country, the Dominion of Canada, in 1867** — `CORRECT_ANSWER` (p. 33). From 1864–1867 the Fathers of Confederation worked together to establish the new country; the old Province of Canada was split into Ontario and Quebec, which with NB and NS formed the Dominion of Canada on July 1, 1867.
- ❌ The 1982 patriation of the Constitution from Britain to Canada — `ANACHRONISM` (pp. 12, 33). A real milestone, but that's patriation of the Constitution, not Confederation, and it happened 115 years later.
- ❌ An alliance of First Nations who united to negotiate treaties with the Crown — `WRONG_CATEGORY` (p. 25). "Confederation" here describes the union of *colonies/provinces*; the Iroquois Confederacy is a different use of the word.
- ❌ The agreement that made Canada fully independent of the British Parliament — `PARTIALLY_CORRECT` (p. 33). Confederation created a self-governing Dominion, but Britain still passed the BNA Act and retained roles; full constitutional independence came later.

---

### DRAFT-06 — covers official #13
**Topic:** history / insulin · **Difficulty:** medium · **Source:** Modern Canada, p. 52 · **Cross-ref:** Q090

**Q: What is the significance of the discovery of insulin by Sir Frederick Banting and Charles Best?**

- ✅ **It produced a treatment for diabetes that has saved an estimated 16 million lives worldwide** — `CORRECT_ANSWER` (p. 52). The caption states Banting (of Toronto) and Best discovered insulin, "a hormone to treat diabetes that has saved 16 million lives worldwide."
- ❌ It was the first vaccine ever developed in Canada — `WRONG_CATEGORY` (p. 52). Insulin is a hormone treatment for diabetes, not a vaccine.
- ❌ It cured polio and led to the eradication of the disease in Canada — `PLAUSIBLE_DISTRACTOR`. A medically plausible-sounding distractor, but insulin treats diabetes; polio is unrelated and not mentioned.
- ❌ It earned Canada its first Nobel Prize in Physics — `COMMON_MISCONCEPTION`. Banting's recognition came in medicine, not physics; the guide highlights the lives saved, not a prize.

---

### DRAFT-07 — covers official #14
**Topic:** government / head_of_state_vs_head_of_government · **Difficulty:** medium · **Source:** How Canadians Govern Themselves, p. 57

**Q: What does it mean to say that Canada is a constitutional monarchy?**

- ✅ **Canada's Head of State is a hereditary Sovereign (Queen or King) who reigns in accordance with the Constitution — the rule of law** — `CORRECT_ANSWER` (p. 57). Quoted from the "Constitutional Monarchy" section; the Sovereign is a symbol of sovereignty and a guardian of constitutional freedoms.
- ❌ Canada is governed directly by the King or Queen, who makes the country's laws — `COMMON_MISCONCEPTION` (p. 57). The Sovereign reigns but does not rule; the Prime Minister, as Head of Government, "actually directs the governing of the country."
- ❌ Canadians elect a monarch to a fixed term as Head of State — `ANACHRONISM`/contradiction (p. 57). The Sovereign is *hereditary*, not elected.
- ❌ It means the monarchy has been abolished and replaced by an elected president — `WRONG_CATEGORY`. That would describe a republic, the opposite of a constitutional monarchy.

---

### DRAFT-08 — covers official #22
**Topic:** government / federal_election_timing · **Difficulty:** easy · **Source:** Federal Elections, p. 60 · **Cross-ref:** Q308

**Q: Who is your member of Parliament (MP)?**

- ✅ **The candidate elected in your electoral district (riding) to represent you in the House of Commons** — `CORRECT_ANSWER` (p. 60). Each electoral district elects one MP, who "sits in the House of Commons to represent them, as well as all Canadians."
- ❌ The Senator appointed to represent your province — `RELATED_FACT` (p. 55). Senators are appointed by the Governor General on the PM's advice; they are not your elected MP.
- ❌ The mayor or councillor of your municipality — `WRONG_CATEGORY` (p. 66). Those are municipal officials; an MP sits federally in the House of Commons.
- ❌ The member of the provincial Legislative Assembly (MLA/MNA/MPP) for your area — `PLAUSIBLE_DISTRACTOR` (p. 58). Easy to confuse, but those serve in the *provincial* legislature, not the federal House of Commons.

---

### DRAFT-09 — covers official #23
**Topic:** government / federal_state · **Difficulty:** easy · **Source:** Federal State / Other Levels of Government, pp. 54, 66

**Q: What are the three levels of government in Canada?**

- ✅ **Federal, provincial/territorial, and municipal (local)** — `CORRECT_ANSWER` (pp. 54, 66). P. 54 lists federal, provincial, territorial and municipal governments; p. 66 treats municipal as the local level. The standard study-question answer groups these as the three levels.
- ❌ Executive, Legislative, and Judicial — `WRONG_CATEGORY` (p. 58). Those are the three *branches* of government, not the three *levels*. (Trap: study question #15 asks for these.)
- ❌ The Sovereign, the Senate, and the House of Commons — `RELATED_FACT` (p. 55). Those are the three *parts of Parliament*, not levels of government.
- ❌ Federal, regional, and international — `PLAUSIBLE_DISTRACTOR`. Plausible-sounding, but "regional" and "international" are not the levels Discover Canada describes.

---

### DRAFT-10 — covers official #26
**Topic:** symbols / canadian_symbols · **Difficulty:** easy · **Source:** Canadian Symbols, pp. 79–82

**Q: Which pair are both recognized Canadian symbols in Discover Canada?**

- ✅ **The maple leaf flag and the beaver** — `CORRECT_ANSWER` (pp. 79, 82). The national flag with the red maple leaf was first raised in 1965 (p. 79); the beaver was adopted centuries ago and appears as an official emblem (p. 82).
- ❌ The bald eagle and the Statue of Liberty — `WRONG_CATEGORY`. Both are symbols of the United States, not Canada.
- ❌ The fleur-de-lys flag and the Union Jack as Canada's *national* flag — `PARTIALLY_CORRECT` (p. 79). The fleur-de-lys is Quebec's flag and the Union Jack is Canada's official *Royal* flag, but neither is the national flag of Canada.
- ❌ The shamrock and the thistle — `PLAUSIBLE_DISTRACTOR`. Emblems of Ireland and Scotland; though part of Canada's heritage, they are not listed as Canadian national symbols.

---

*Generated 2026-05-25. Drafts await your review before any merge into the bank.*
