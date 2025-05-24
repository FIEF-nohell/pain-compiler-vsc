# Challenge 1: Pyramide mit Zahlen
for i in range(1, 6):
    spaces = 5 - i
    if i == 1:
        print(' ' * spaces + str(i))
    else:
        print(' ' * spaces + str(i) + ' ' * (2 * i - 3) + str(i))

# Challenge 2: Fortlaufende Zahlen
counter = 0
for row in range(1, 5):
    line = []
    for _ in range(row):
        line.append(str(counter))
        counter += 1
    print(' '.join(line))

# Challenge 3: Buchstaben-Pyramide
for i in range(4):
    ch = chr(ord('A') + i)
    if i == 0:
        print(ch)
    else:
        print(ch + ' ' * (2 * i - 1) + ch)

