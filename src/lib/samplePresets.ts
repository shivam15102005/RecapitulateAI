import type { Difficulty } from '../types/study';

export interface SamplePreset {
  id: string;
  label: string;
  subject: string;
  description: string;
  difficulty: Difficulty;
  notes: string;
}

export const samplePresets: SamplePreset[] = [
  {
    id: 'cell-biology',
    label: 'Cell Biology',
    subject: 'Biology',
    description: 'Cell structure, organelles, and membrane transport',
    difficulty: 'Beginner',
    notes: `CELL BIOLOGY — STUDY NOTES

Cell theory states that all living organisms are made of one or more cells, the cell is the basic unit of life, and all cells arise from pre-existing cells.

The plasma membrane is a selectively permeable phospholipid bilayer. Hydrophilic phosphate heads face the aqueous environments, while hydrophobic fatty-acid tails face inward. Membrane proteins support transport, recognition, signalling, and structural attachment. The fluid mosaic model describes proteins embedded in or associated with a dynamic lipid bilayer.

The nucleus stores most of the cell's DNA. The nucleolus produces ribosomal RNA and helps assemble ribosomal subunits. Ribosomes translate messenger RNA into proteins. Rough endoplasmic reticulum has ribosomes and is involved in synthesis and initial processing of proteins destined for secretion or membranes. Smooth endoplasmic reticulum participates in lipid synthesis, detoxification, and calcium storage.

The Golgi apparatus modifies, sorts, and packages proteins and lipids into vesicles. Mitochondria carry out most aerobic cellular respiration and produce ATP through oxidative phosphorylation. They have a double membrane and their own DNA. Lysosomes contain hydrolytic enzymes for intracellular digestion and recycling. Peroxisomes perform oxidation reactions and break down fatty acids and hydrogen peroxide.

In passive transport, substances move down their concentration or electrochemical gradient without direct energy input. Simple diffusion moves small non-polar molecules through the lipid bilayer. Facilitated diffusion uses channels or carrier proteins. Osmosis is the net movement of water across a selectively permeable membrane. Active transport moves substances against a gradient using energy, directly or indirectly. The sodium-potassium pump uses ATP to move three Na+ ions out of the cell and two K+ ions into the cell per cycle.

Prokaryotic cells lack a membrane-bound nucleus and membrane-bound organelles. Eukaryotic cells have a nucleus and compartmentalized organelles. Plant cells typically have a cellulose cell wall, chloroplasts, and a large central vacuole; animal cells do not have these structures in the same form.`,
  },
  {
    id: 'newton-laws',
    label: "Newton's Laws",
    subject: 'Physics',
    description: 'Force, inertia, acceleration, and action–reaction pairs',
    difficulty: 'Intermediate',
    notes: `NEWTON'S LAWS OF MOTION — STUDY NOTES

Newton's First Law (law of inertia): An object remains at rest or continues moving with constant velocity in a straight line unless acted upon by a non-zero resultant external force. Inertia is an object's resistance to a change in its state of motion. Mass is a measure of inertia. Equilibrium occurs when the vector sum of forces is zero; an object in equilibrium may be at rest or move with constant velocity.

Newton's Second Law: The net external force on an object equals the rate of change of its momentum. For constant mass, F_net = m a. Force is a vector and acceleration is in the direction of the net force. The SI unit of force is the newton (N), where 1 N = 1 kg m s^-2. If the same net force acts on two objects, the object with smaller mass has greater acceleration.

Newton's Third Law: When object A exerts a force on object B, object B simultaneously exerts a force equal in magnitude and opposite in direction on object A. The two forces act on different objects, so they do not cancel each other in a single-object free-body diagram. Action–reaction pairs are present in contact interactions and non-contact interactions such as gravity.

A free-body diagram isolates one object and represents every external force acting on it. Common forces include weight (mg, vertically downward near Earth's surface), normal reaction (perpendicular to a contact surface), tension (along a taut string or cable), friction (parallel to the contact surface and opposing relative motion or its tendency), and applied force.

Static friction adjusts up to a maximum value f_s,max = μ_s N. Kinetic friction is approximately f_k = μ_k N, where μ_k is the coefficient of kinetic friction and N is the normal force. Friction is not always equal to μN; the equality is used at limiting static friction or for the kinetic-friction model.

On an inclined plane at angle θ, weight can be resolved into mg sin θ parallel to the plane and mg cos θ perpendicular to the plane. In the absence of acceleration perpendicular to the plane and other perpendicular forces, the normal force is mg cos θ.

A reliable problem-solving method is to identify the system, draw a free-body diagram, choose coordinate axes, resolve forces into components, apply ΣF = ma along each axis, and check units and signs.`,
  },
  {
    id: 'french-revolution',
    label: 'French Revolution',
    subject: 'History',
    description: 'Causes, key events, political change, and consequences',
    difficulty: 'Intermediate',
    notes: `THE FRENCH REVOLUTION (1789–1799) — STUDY NOTES

Before 1789, French society was divided into three estates. The First Estate consisted of the clergy, the Second Estate of the nobility, and the Third Estate included the bourgeoisie, urban workers, and peasants. The first two estates enjoyed significant privileges, while the Third Estate carried much of the tax burden.

Major causes included an unequal social structure, state debt from wars and royal expenditure, an unfair tax system, poor harvests and rising bread prices, and Enlightenment ideas about liberty, popular sovereignty, and rights. The American Revolution also provided an example of resistance to monarchy and colonial authority.

In May 1789, Louis XVI convened the Estates-General to address the financial crisis. Disputes over voting led representatives of the Third Estate to declare themselves the National Assembly. On 20 June 1789, they took the Tennis Court Oath, pledging not to separate until France had a constitution. On 14 July 1789, a Paris crowd stormed the Bastille, a royal fortress and prison, which became a symbol of the revolution.

In August 1789, the National Assembly adopted the Declaration of the Rights of Man and of the Citizen. It affirmed principles such as liberty, equality before the law, property, and popular sovereignty. In October 1789, the Women's March on Versailles pressured the royal family to move to Paris.

The Constitution of 1791 established a constitutional monarchy and a system of limited suffrage. In 1792, the monarchy was abolished and France became a republic. Louis XVI was executed in January 1793. The Reign of Terror (1793–1794), associated with the Committee of Public Safety and Maximilien Robespierre, involved mass executions of perceived enemies of the revolution. Robespierre fell from power in July 1794 during the Thermidorian Reaction.

The Directory governed from 1795 to 1799 but faced instability, corruption, and military pressures. On 9 November 1799 (18 Brumaire), Napoleon Bonaparte carried out a coup that ended the Directory and established the Consulate, commonly treated as the end of the revolutionary period.

The revolution weakened feudal privileges, promoted legal equality for men, spread ideas of citizenship and nationalism, and reshaped European politics. However, it also involved political violence, war, and limits on equality, including the exclusion of women from full political rights.`,
  },
];
