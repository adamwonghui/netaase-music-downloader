list = []
for i in range (2,100):
    Flag = False
    for q in range(2,i):
        if i % q ==0:
            Flag = True
            break
    if Flag:
        print(f"{i}是合数")
    else:
        print(f"{i}是素数")
              