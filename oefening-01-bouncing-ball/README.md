Stap 1: Volledige horizontale botsing
* Wat heb ik gedaan? Ik heb een tweede voorwaarde toegevoegd aan het if-statement.
* Techniek: Door de OR-operator (||) te gebruiken, controleert de computer nu of de bal de rechterrand (width) óf de linkerrand (0) raakt.

Geleerd: Ik begrijp nu dat speed * -1 een positief getal negatief maakt, en een negatief getal weer positief. Dit zorgt voor het "stuiter" effect.

Stap 2: Interactieve kleuren* Wat heb ik gedaan? De bal verandert nu van kleur telkens als hij een muur raakt.
* Techniek: Ik heb variabelen voor R, G en B aangemaakt en de random() functie gebruikt binnen het if-block.Geleerd: Code binnen een if-statement wordt alleen uitgevoerd op het moment van de botsing. Dat is het perfecte moment om een nieuwe kleur te "kiezen".

Stap 3: De map() functie toepassen
* Wat heb ik gedaan? De achtergrondkleur reageert nu op de positie van de bal.
* Techniek: De map() functie rekent de positie van de bal (0 tot 600) om naar een kleurwaarde (0 tot 255).
* Geleerd: map() is super krachtig om verschillende schalen met elkaar te verbinden, zoals beweging en kleur.