# BioNova Schema Definitions

Define SHACL shapes for a pharmaceutical company dataset with 500-600 entities.

## Critical Stable Identifiers

These specific subjects MUST appear consistently in generated content for evaluation scenarios:

**People**: Apollo (CEO), Zeus (Chief Scientific Officer/CSO), Minerva (Director, BioNova R&D), Hephaestus (Director, BioNova Manufacturing), Rhea (Director, BioNova Commercial), Gaia (CTO/Director, BioNova IT), Thoth (Principal Scientist, Drug Discovery Team Lead), Chronos (Senior Scientist), Demeter (Manufacturing Manager), Athena (Senior Scientist)

**Organizations**: BioNova (HQ), BioNova R&D, BioNova Manufacturing, BioNova Commercial, BioNova IT, Drug Discovery Team

**Projects**: Alpha, Beta, Gamma, Delta, Epsilon, Zeta

**Drugs**: Oncora (oncology), Cardiozen (cardiovascular), Immunex (immunotherapy), Immunex-Plus (combination therapy requiring Immunex + Cardiozen)

**Platforms**: MolecularForge (AI drug discovery), ClinicalStream (trial management), BioAnalyzer (lab data), ProcessControl (manufacturing), ManufacturingOS (depends on ProcessControl + BioAnalyzer)

**Events**: GMP Training

**Courses**: "Regulatory Affairs and FDA Submissions" (advanced course), "Manufacturing Excellence" (certification track), courses with GMP compliance content

**Policies**: Master Quality Management System Policy (top-level), Clinical Trial Policy (cites master policy), policies covering FDA, GMP, HIPAA, ICH-GCP compliance

**Key Relationships**:
- Zeus (CSO) manages department directors: Minerva, Hephaestus, Rhea, Gaia
- Thoth leads Drug Discovery Team (within BioNova R&D)
- Drug Discovery Team uses MolecularForge platform
- Demeter manages team within Manufacturing
- ManufacturingOS depends on ProcessControl AND BioAnalyzer
- Immunex-Plus development requires Oncora completion
- Manufacturing personnel attend GMP Training events

## Entity Types and Properties

### People (Person)
- Properties: name, job title, works for
- Works for links to Organizations (bidirectional with member/employee)
- 261 instances total (140 employees + 121 external)
- Examples: Apollo, Zeus, Minerva, Hephaestus, Rhea, Gaia, Thoth, Chronos, Demeter, Athena

### Organizations (Organization)
- Properties: name, member, employee, parent organization, sub-organization
- Member and employee link to People (bidirectional with works for)
- Parent organization links to Organizations (bidirectional with sub-organization)
- 28 instances (4 departments, 15 teams, 9 external partners)
- Examples: BioNova (HQ), BioNova R&D (department), BioNova Manufacturing (department), Drug Discovery Team (team within R&D)

### Projects (Project)
- Properties: name
- 6 instances (Alpha, Beta, Gamma, Delta, Epsilon, Zeta)
- Examples: Alpha, Beta (projects involving Drug Discovery team)

### Publications (Scholarly Article)
- Properties: name, description, about, identifier, author, date published
- Author links to People
- 84 instances (75 detailed + 9 names only)

### Blog Posts (Blog Posting)
- Properties: name, headline, article body, about, author, date published, is part of, mentions
- Author links to People
- Is part of links to Digital Documents (bidirectional with has part)
- 67 instances (42 detailed + 25 names only)

### Comments (Comment)
- Properties: about, author, text, date created
- Author links to People
- 55 instances

### Software Applications (Software Application)
- Properties: name, description, application category, software version, software requirements, is related to
- Software requirements links to Software Applications
- 37 instances (14 detailed + 23 names only)
- Examples: MolecularForge (AI drug discovery platform), ClinicalStream (trial management), BioAnalyzer (lab data analysis), ProcessControl (manufacturing control), ManufacturingOS (requires ProcessControl + BioAnalyzer)

### Reviews (Review)
- Properties: name, author, item reviewed, review body, review rating, mentions
- Author links to People
- Item reviewed links to Software Applications
- Review rating links to Ratings
- 35 instances

### FAQ Pages (FAQ Page)
- Properties: name, main entity
- Main entity links to Questions
- 35 instances

### Questions (Question)
- Properties: name, accepted answer
- Accepted answer links to Answers
- 35 instances

### Answers (Answer)
- Properties: text, mentions, about
- 35 instances

### Clinical Trials (Medical Trial)
- Properties: name, description, identifier, citation, location, study subject, investigator
- Citation links to Digital Documents
- 27 instances (18 detailed + 9 names only)

### Roles (Role)
- Properties: role name, main entity, main entity of page, start date, end date
- Main entity links to Questions
- Main entity of page links to Organizations
- 25 instances

### Creative Works (Creative Work)
- Properties: name, description, about, identifier, is part of, contributor, creator, date created, date modified
- Is part of links to Digital Documents (bidirectional with has part)
- Contributor and creator link to People
- 24 instances

### How-To Guides (How-To)
- Properties: name, description, identifier, step, is related to
- 20 instances

### Digital Documents (Digital Document)
- Properties: name, description, identifier, is part of, citation, has part, is related to
- Is part of links to Digital Documents (bidirectional with has part)
- Citation links to Digital Documents (bidirectional with has part)
- Has part links to Digital Documents (bidirectional with citation)
- 17 instances

### Drugs (Drug)
- Properties: name, description, identifier, is part of, drug class, active ingredient, clinical pharmacology, legal status, is related to
- Is part of links to Drugs (for pipeline dependencies)
- 9 instances
- Examples: Oncora (oncology drug), Cardiozen (cardiovascular), Immunex (immunotherapy), Immunex-Plus (requires Immunex + Cardiozen completion)

### Training Courses (Course)
- Properties: name, description, identifier, provider, educational credential awarded, course prerequisites, is related to
- Provider links to Organizations
- Course prerequisites links to Courses
- 16 instances (12 detailed + 4 names only)
- Examples: "Regulatory Affairs and FDA Submissions" (advanced course with prerequisites), courses in "Manufacturing Excellence" certification track, GMP compliance training courses

### Medical Organizations (Medical Organization)
- Properties: name, description, identifier, employee, address, is related to
- Employee links to People
- Address links to Postal Addresses
- 15 instances

### Postal Addresses (Postal Address)
- Properties: street address, address locality, address region, postal code, address country
- 15 instances

### Policies (Policy)
- Properties: name
- 10 instances
- Examples: Master Quality Management System Policy (top-level/root policy), Clinical Trial Policy (cites Master QMS), policies covering FDA, GMP, HIPAA, ICH-GCP compliance

### Events (Event)
- Properties: name, description, about, attendee, organizer, start date, end date
- 8 instances
- Examples: GMP Training (attended by Manufacturing personnel)

### Services (Service)
- Properties: name, description, provider, service type, area served, is related to
- Provider links to Organizations
- 3 instances

### Ratings (Rating)
- Properties: rating value, best rating, worst rating
- 2 instances

### Platforms (Platform)
- Properties: name
- 1 instance

### Blogs (Blog)
- Properties: blog post
- 1 instance
