# 用户输入3族数据，判断是否能构成三角形。如果能，则输出是能；如果不能，则输出不能。
a = float(input("请输入第一条边长："))
b = float(input("请输入第二条边长："))
c = float(input("请输入第三条边长："))
if a + b > c and a + c > b and b + c > a:
    print("能构成三角形")
else:
    print("不能构成三角")