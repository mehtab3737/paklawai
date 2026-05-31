# PakLaw AI — Testing Prompts & Expected Answers

Use the following queries to verify the retrieval accuracy, embedding matching, and context synthesis of the chatbot. These prompts target specific sections of documents that are already successfully ingested into the database.

---

## 1. The Child Marriage Restraint Act, 1929

### Query
> What is the legal definition of a "child" and what are the penalties for solemnising a child marriage under the Child Marriage Restraint Act of 1929?

### Expected Answer Elements
*   **Definition of a "child"**: A male who is under eighteen (18) years of age, and a female who is under sixteen (16) years of age (Section 2).
*   **Penalty for Solemnising**: Any person who performs, conducts, or directs a child marriage is punishable with simple imprisonment up to one (1) month, or a fine up to one thousand (1,000) rupees, or both (Section 5).
*   **Other Penalties (Optional but retrieved)**: A male adult above 18 marrying a child faces the same penalty (Section 4); parents or guardians promoting/negligently failing to prevent child marriage face the same penalty except that no woman can be imprisoned (Section 6).

### Source File
*   **File Path**: `data/Pakistan_Code_PDFs/C/administrator0cb12b901d4304d7e5463da076d88639.txt`
*   **Expected Chunks**: Chunk 0 and Chunk 1

---

## 2. The Conciliation Courts Ordinance, 1961

### Query
> Can legal practitioners represent parties in a Conciliation Court, and what is the composition of the court under the Conciliation Courts Ordinance of 1961?

### Expected Answer Elements
*   **Appearance of Counsel**: No legal practitioner (lawyer) is permitted to represent or appear on behalf of any party before a Conciliation Court or Controlling Authority (Section 16).
*   **Composition**: The court consists of a Chairman (the Chairman of the Union Council or ward representative) and two (2) representatives nominated by each of the opposing parties (Section 5).
*   **Purdanashin representation**: A purdanashin lady may be represented by a duly authorized agent who cannot be a paid agent (Section 16(2)).

### Source File
*   **File Path**: `data/Pakistan_Code_PDFs/C/administratorf161addf2835d80f9c3e460daa990828.txt`
*   **Expected Chunks**: Chunk 8, Chunk 9, and Chunk 12

---

## 3. The Banks (Nationalization) Act, 1974

### Query
> What happens to the application of the Banks (Nationalization) Act if the Federal Government sells bank shares under Section 5A?

### Expected Answer Elements
*   **Up to 49% Shares Sold**: The application of the provisions of the Act (other than that subsection itself) stands suspended for a specified period and on terms determined by the Federal Government (Section 5A(1)(a)).
*   **51% or More Shares Sold**: The provisions of the Banks (Nationalization) Act **cease to apply** to that bank entirely, returning it fully to the private sector (Section 5A(1)(b)).
*   **Power to modify terms**: The Federal Government maintains the power to vary, modify, or review the terms of sale/transfer in the public interest (Section 5A(2)-(3)).

### Source File
*   **File Path**: `data/Pakistan_Code_PDFs/B/administratorc561babe62ce911c0ba3f2f7a259a939.txt`
*   **Expected Chunks**: Chunk 1 and Chunk 2
