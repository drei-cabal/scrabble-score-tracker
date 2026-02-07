Scrabble Game Mechanics and Scoring System

This document outlines the standard rules, tile distributions, and scoring logic for the English version of Scrabble.

## 1. Tile Values (Point System)
Letters are assigned values based on their frequency in the English language.

| Points | Letters |
| :--- | :--- |
| **0** | Blank (Wildcard) |
| **1** | A, E, I, O, U, L, N, S, T, R |
| **2** | D, G |
| **3** | B, C, M, P |
| **4** | F, H, V, W, Y |
| **5** | K |
| **8** | J, X |
| **10** | Q, Z |

## 2. Letter Distribution (Total: 100 Tiles)
A standard bag must contain exactly 100 tiles. Your application should validate against these counts to prevent "impossible" board states.

* **12 tiles:** E
* **9 tiles:** A, I
* **8 tiles:** O
* **6 tiles:** N, R, T
* **4 tiles:** L, S, U, D
* **3 tiles:** G
* **2 tiles:** B, C, M, P, F, H, V, W, Y, Blank
* **1 tile:** K, J, X, Q, Z

## 3. Board Multipliers (15x15 Grid)
Multipliers are fixed-position squares that enhance the score. 

* **Double Letter (DL):** Multiplies the value of the specific tile by 2.
* **Triple Letter (TL):** Multiplies the value of the specific tile by 3.
* **Double Word (DW):** Multiplies the total value of the entire word by 2.
* **Triple Word (TW):** Multiplies the total value of the entire word by 3.