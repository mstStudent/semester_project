from browser import document
from browser import html
from browser import svg

class node():
	def __init__(self, data):
		self.data = data
		self.parent = None
		self.children = []

	def siblings(self):
		if(self.parent is not None):
			return len(self.parent.children)
		else:
			return 1

	def siblingIndex(self):
		if(self.parent is not None):
			return self.parent.children.index(self)
		else:
			return 0

	def level(self):
		if(self.parent is not None):
			return self.parent.level() + 1
		else:
			return 1

	def removeFromParent(self):
		self.parent = None

	def addChild(self, child):
		self.children.append(child)
		child.parent = self

def nodeToSVG(aNode, width, padding):
	i = aNode.siblingIndex()
	j = aNode.level()

	widthToUse = width - padding
	height = 50

	x = i * width
	y = 300 - (j * (height + padding))

	container = svg.g()

	container <= svg.rect(
		id="rect_[{0}][{1}]".format(i, j),
		x=x,
		y=y,
		width=widthToUse,
		height=height,
		fill="blue")

	container <= svg.text(
		aNode.data,
		id="text_[{0}][{1}]",
		x=x,
		y=y,
		font_size="22",
		stroke_color="black")

	return container

# maybe we can just do all manipulation in the dom tree?
# why do we need the data structure at all?
# when we add an element to the DOM tree it is automatically aware
# of its parent and children through Brython, using this information
# can we calculate the appropriate width and position? 
# We need to be able to grab our index within children (easy, it's a list)
# We also need to know the total number of children (easy, len(parent.children))
# Does this cause future problems?
# Dragging and dropping is a matter of resizing the destination level
# and then asking the dragged tree to resize itself according to its location in
# the destination level.


def treeToSVG(rootNode, rootDOM, startingWidth, padding):
	# calculate width here avoid parent lookup later
	numChildren = len(rootNode.children)
	nextWidth = startingWidth
	if(numChildren > 0):
		nextWidth = startingWidth / numChildren

	for child in rootNode.children:
		treeToSVG(child, rootDOM, nextWidth, padding)

	rootDOM <= nodeToSVG(rootNode, startingWidth, padding)

myTree = node('root')
branch = node('branch')
leaf = node('leafUnderBranch')
leaf1 = node('leaf1')
leaf2 = node('leaf2')
leaf3 = node('leafalsounderbranch')

branch.addChild(leaf3)
branch.addChild(leaf)
myTree.addChild(branch)
myTree.addChild(leaf1)
myTree.addChild(leaf2)

print(branch.siblings())
print(branch.level())

panel = document['panel']
treeToSVG(myTree, panel, 1000, 20)

# to see what attributes a given object has
#for a in document["theOneSVG"].attributes:
#	print(a.nodeName, a.value)