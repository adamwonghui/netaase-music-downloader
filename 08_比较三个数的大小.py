a = int(input("请输入第一个数"))
b = int(input("请输入第二个数"))
c = int(input("请输入第三个数"))
if a > b and a > c:         
    print(f"最大的数是{a}", end=',')
    if b > c:
        print(f"中间数是{b},最小的是{c}")
    else:
        print(f"中间数是{c},最小的是{b}")
elif b > a and b > c:
    print(f"最大的数是{b}", end=',')
    if a > c:
        print(f"中间数是{a},最小的是{c}")
    else:
        print(f"中间数是{c},最小的是{a}")
else:
    print(f"最大的数是{c}", end=',') 
    if a > b:
        print(f"中间数是{a},最小的是{b}")
    else:
        print(f"中间数是{b},最小的是{a}")

